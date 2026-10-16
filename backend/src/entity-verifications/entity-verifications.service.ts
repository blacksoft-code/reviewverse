import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  VerificationDocType,
  VerificationStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';
import { NotificationsService } from '../notifications/notifications.service';

import { VerificationStorageService } from './verification-storage.service';
import { ApplyVerificationDto } from './dto/apply-verification.dto';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALIDITY_DAYS = 365;
const RENEWAL_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Client-এর পাঠানো mime বিশ্বাস না করে file-এর আসল শুরুর bytes দেখে type ধরা হয়
function sniffMime(buf: Buffer): string | null {
  if (buf.length >= 4 && buf.subarray(0, 4).toString('latin1') === '%PDF') {
    return 'application/pdf';
  }

  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }

  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

const ACTIVE: VerificationStatus[] = ['PENDING', 'UNDER_REVIEW'];

@Injectable()
export class EntityVerificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EntityVerificationsService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
    private notifications: NotificationsService,
    private storage: VerificationStorageService,
  ) {}

  // মেয়াদ শেষ হওয়া badge প্রতি ঘণ্টায় নিজে থেকে বাতিল হয় (cron লাগে না)
  onModuleInit() {
    const run = () =>
      this.expireOverdue().catch((e) =>
        this.logger.error('Expiry check failed', e),
      );

    run();
    this.timer = setInterval(run, 60 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ─────────────────────────────
  // helpers
  // ─────────────────────────────

  // Business settings একটা business-mode কাজ — ঐ business-এর profile থেকেই
  private requireActing(entityId: string, acting?: string) {
    if (acting !== entityId) {
      throw new ForbiddenException(
        'Switch to this business profile to manage verification.',
      );
    }
  }

  private async requireMember(entityId: string, userId: string) {
    const ok = await this.entityMemberships.hasAccess(entityId, userId);

    if (!ok) {
      throw new ForbiddenException(
        'Only the business owner or manager can manage verification.',
      );
    }
  }

  private async notifyMembers(entityId: string, message: string) {
    const members = await this.prisma.entityMembership.findMany({
      where: { entityId },
      select: { userId: true },
    });

    await this.notifications.notifyMany(
      members.map((m) => m.userId),
      {
        type: 'VERIFICATION_UPDATE',
        message,
        link: `/business/${entityId}/settings`,
        entityId,
      },
    );
  }

  async expireOverdue(entityId?: string) {
    const now = new Date();

    await this.prisma.entityVerification.updateMany({
      where: {
        status: 'APPROVED',
        expiresAt: { lt: now },
        ...(entityId ? { entityId } : {}),
      },
      data: { status: 'EXPIRED' },
    });

    await this.prisma.entity.updateMany({
      where: {
        isVerified: true,
        verifiedUntil: { lt: now },
        ...(entityId ? { id: entityId } : {}),
      },
      data: { isVerified: false },
    });
  }

  // ─────────────────────────────
  // BUSINESS SIDE
  // ─────────────────────────────

  async getStatus(entityId: string, userId: string) {
    await this.requireMember(entityId, userId);
    await this.expireOverdue(entityId);

    const [entity, applications] = await Promise.all([
      this.prisma.entity.findUnique({
        where: { id: entityId },
        select: {
          isVerified: true,
          verifiedAt: true,
          verifiedUntil: true,
        },
      }),
      this.prisma.entityVerification.findMany({
        where: { entityId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          applicantNote: true,
          reviewNote: true,
          reviewedAt: true,
          approvedAt: true,
          expiresAt: true,
          createdAt: true,
          documents: {
            select: {
              id: true,
              type: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const hasActive = applications.some((a) =>
      ACTIVE.includes(a.status),
    );

    const renewalDue =
      entity.isVerified &&
      !!entity.verifiedUntil &&
      entity.verifiedUntil.getTime() - Date.now() <=
        RENEWAL_WINDOW_DAYS * DAY_MS;

    return {
      isVerified: entity.isVerified,
      verifiedAt: entity.verifiedAt,
      verifiedUntil: entity.verifiedUntil,
      renewalDue,
      // আবেদন করা যাবে: চলমান আবেদন নেই, আর হয় verified না, নয়তো renewal-এর সময় হয়েছে
      canApply: !hasActive && (!entity.isVerified || renewalDue),
      applications,
    };
  }

  async apply(
    entityId: string,
    userId: string,
    actingEntityId: string | undefined,
    files: Express.Multer.File[],
    dto: ApplyVerificationDto,
  ) {
    this.requireActing(entityId, actingEntityId);
    await this.requireMember(entityId, userId);

    const status = await this.getStatus(entityId, userId);

    if (!status.canApply) {
      throw new ConflictException(
        status.isVerified
          ? 'This business is already verified.'
          : 'You already have a verification request in progress.',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please upload at least one document.',
      );
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        `You can upload at most ${MAX_FILES} documents.`,
      );
    }

    let types: unknown;

    try {
      types = JSON.parse(dto.types);
    } catch {
      throw new BadRequestException('Invalid document types.');
    }

    const validTypes = Object.values(VerificationDocType);

    if (
      !Array.isArray(types) ||
      types.length !== files.length ||
      !types.every((t) => validTypes.includes(t as VerificationDocType))
    ) {
      throw new BadRequestException(
        'Each document needs a valid type.',
      );
    }

    // আসল file content দেখে type/size যাচাই
    const checked = files.map((file) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `${file.originalname} is larger than 10 MB.`,
        );
      }

      const mimeType = sniffMime(file.buffer);

      if (!mimeType) {
        throw new BadRequestException(
          `${file.originalname}: only PDF, JPG, PNG or WebP files are allowed.`,
        );
      }

      return { file, mimeType };
    });

    // Encrypt করে private storage-এ রাখা; DB-তে শুধু metadata
    const storedKeys: string[] = [];

    try {
      const documents: {
        type: VerificationDocType;
        originalName: string;
        mimeType: string;
        size: number;
        storageKey: string;
      }[] = [];

      for (let i = 0; i < checked.length; i++) {
        const { file, mimeType } = checked[i];
        const storageKey = await this.storage.save(file.buffer);
        storedKeys.push(storageKey);

        documents.push({
          type: (types as VerificationDocType[])[i],
          originalName: file.originalname.slice(0, 200),
          mimeType,
          size: file.size,
          storageKey,
        });
      }

      await this.prisma.entityVerification.create({
        data: {
          entityId,
          applicantId: userId,
          applicantNote: dto.note?.trim() || null,
          documents: { create: documents },
        },
      });
    } catch (err) {
      await Promise.all(storedKeys.map((k) => this.storage.remove(k)));
      throw err;
    }

    return this.getStatus(entityId, userId);
  }

  // Review শুরুর আগে (PENDING) আবেদন তুলে নেওয়া যায়
  async withdraw(
    verificationId: string,
    userId: string,
    actingEntityId?: string,
  ) {
    const verification =
      await this.prisma.entityVerification.findUnique({
        where: { id: verificationId },
        include: { documents: { select: { storageKey: true } } },
      });

    if (!verification) {
      throw new NotFoundException('Application not found.');
    }

    this.requireActing(verification.entityId, actingEntityId);
    await this.requireMember(verification.entityId, userId);

    if (verification.status !== 'PENDING') {
      throw new ConflictException(
        'Only a pending application can be withdrawn.',
      );
    }

    await this.prisma.entityVerification.delete({
      where: { id: verificationId },
    });

    await Promise.all(
      verification.documents.map((d) =>
        this.storage.remove(d.storageKey),
      ),
    );

    return this.getStatus(verification.entityId, userId);
  }

  // ─────────────────────────────
  // ADMIN SIDE (verification team = এখন Admin)
  // ─────────────────────────────

  async adminList(status?: VerificationStatus) {
    await this.expireOverdue();

    return this.prisma.entityVerification.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        status: true,
        applicantNote: true,
        reviewNote: true,
        reviewedAt: true,
        approvedAt: true,
        expiresAt: true,
        createdAt: true,
        entity: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },
        applicant: {
          select: { id: true, name: true, email: true },
        },
        reviewer: { select: { id: true, name: true } },
        documents: {
          select: {
            id: true,
            type: true,
            originalName: true,
            mimeType: true,
            size: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private async getForReview(id: string) {
    const verification =
      await this.prisma.entityVerification.findUnique({
        where: { id },
      });

    if (!verification) {
      throw new NotFoundException('Application not found.');
    }

    return verification;
  }

  async startReview(id: string, adminId: string) {
    const v = await this.getForReview(id);

    if (v.status !== 'PENDING') {
      throw new ConflictException(
        'Only a pending application can be moved to review.',
      );
    }

    const updated = await this.prisma.entityVerification.update({
      where: { id },
      data: { status: 'UNDER_REVIEW', reviewerId: adminId },
    });

    await this.notifyMembers(
      v.entityId,
      'Your verification request is now under review.',
    );

    return updated;
  }

  async approve(id: string, adminId: string) {
    const v = await this.getForReview(id);

    if (!ACTIVE.includes(v.status)) {
      throw new ConflictException(
        'This application is not waiting for a decision.',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VALIDITY_DAYS * DAY_MS);

    const [updated] = await this.prisma.$transaction([
      this.prisma.entityVerification.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewerId: adminId,
          reviewedAt: now,
          reviewNote: null,
          approvedAt: now,
          expiresAt,
        },
      }),
      // renew হলে আগের approved row গুলো "পুরনো" হয়ে যায়
      this.prisma.entityVerification.updateMany({
        where: {
          entityId: v.entityId,
          status: 'APPROVED',
          id: { not: id },
        },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.entity.update({
        where: { id: v.entityId },
        data: {
          isVerified: true,
          verifiedAt: now,
          verifiedUntil: expiresAt,
        },
      }),
    ]);

    await this.notifyMembers(
      v.entityId,
      'Congratulations! Your business is now verified.',
    );

    return updated;
  }

  async reject(id: string, adminId: string, reason: string) {
    const v = await this.getForReview(id);

    if (!ACTIVE.includes(v.status)) {
      throw new ConflictException(
        'This application is not waiting for a decision.',
      );
    }

    const updated = await this.prisma.entityVerification.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewerId: adminId,
        reviewedAt: new Date(),
        reviewNote: reason.trim(),
      },
    });

    await this.notifyMembers(
      v.entityId,
      'Your verification request was rejected. Open settings to see the reason.',
    );

    return updated;
  }

  // নিয়ম ভাঙলে Verified badge বাতিল
  async revoke(id: string, adminId: string, reason: string) {
    const v = await this.getForReview(id);

    if (v.status !== 'APPROVED') {
      throw new ConflictException(
        'Only an approved verification can be revoked.',
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.entityVerification.update({
        where: { id },
        data: {
          status: 'REVOKED',
          reviewerId: adminId,
          reviewedAt: new Date(),
          reviewNote: reason.trim(),
        },
      }),
      this.prisma.entity.update({
        where: { id: v.entityId },
        data: {
          isVerified: false,
          verifiedUntil: null,
        },
      }),
    ]);

    await this.notifyMembers(
      v.entityId,
      'Your verified badge was revoked. Open settings to see the reason.',
    );

    return updated;
  }

  // Document পড়া — শুধু Admin, আর প্রতিবার log থাকে
  async getDocumentForAdmin(documentId: string, adminId: string) {
    const doc = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found.');
    }

    const buffer = await this.storage.read(doc.storageKey);

    this.logger.log(
      `Admin ${adminId} viewed verification document ${doc.id}`,
    );

    return {
      buffer,
      mimeType: doc.mimeType,
      originalName: doc.originalName,
    };
  }
}
