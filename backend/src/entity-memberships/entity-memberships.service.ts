import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntityMembershipsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────
  // USER FLOW: claim a business
  // ─────────────────────────────
  // Diagram:
  // User → Claim Business
  //   Business already has OWNER? YES → Reject
  //                                NO  → Claim → PENDING
  async claimBusiness(entityId: string, userId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    // Business already has an OWNER? → Reject
    const existingOwner = await this.prisma.entityMembership.findFirst({
      where: { entityId, role: 'OWNER' },
    });

    if (existingOwner) {
      throw new ConflictException(
        'This business already has an owner. Claim cannot be submitted.',
      );
    }

    // এই user আগে থেকেই কোনো claim জমা দিয়েছে কিনা (schema-তে
    // @@unique([userId, entityId]) থাকায় একটাই claim রেকর্ড হয়)
    const existingClaim = await this.prisma.entityClaim.findUnique({
      where: {
        userId_entityId: { userId, entityId },
      },
    });

    if (existingClaim) {
      if (existingClaim.status === 'PENDING') {
        throw new ConflictException(
          'You already have a pending claim for this business.',
        );
      }

      if (existingClaim.status === 'APPROVED') {
        throw new ConflictException('You already own this business.');
      }

      // আগে REJECTED হয়েছিল → আবার claim করতে দেওয়া হচ্ছে, status → PENDING
      return this.prisma.entityClaim.update({
        where: { id: existingClaim.id },
        data: { status: 'PENDING' },
      });
    }

    return this.prisma.entityClaim.create({
      data: {
        entityId,
        userId,
        status: 'PENDING',
      },
    });
  }

  async getMyClaims(userId: string) {
    return this.prisma.entityClaim.findMany({
      where: { userId },
      include: { entity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyMemberships(userId: string) {
    return this.prisma.entityMembership.findMany({
      where: { userId },
      include: { entity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEntityMemberships(entityId: string) {
    return this.prisma.entityMembership.findMany({
      where: { entityId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─────────────────────────────
  // ADMIN FLOW: review claims
  // ─────────────────────────────

  async getPendingClaims() {
    return this.prisma.entityClaim.findMany({
      where: { status: 'PENDING' },
      include: {
        entity: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Admin approves →
  //   EntityClaim.status = APPROVED
  //   EntityMembership(role = OWNER) তৈরি
  //   Locked: No more claims — বাকি pending claim গুলো auto-reject
  async approveClaim(claimId: string) {
    const claim = await this.prisma.entityClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found.');
    }

    if (claim.status !== 'PENDING') {
      throw new BadRequestException(
        'This claim has already been processed.',
      );
    }

    // Race-condition safety: ঠিক এই মুহূর্তে অন্য কোনো claim দিয়ে
    // ইতিমধ্যে owner assign হয়ে গেছে কিনা, সেটা আবার চেক করা হচ্ছে
    const existingOwner = await this.prisma.entityMembership.findFirst({
      where: { entityId: claim.entityId, role: 'OWNER' },
    });

    if (existingOwner) {
      throw new ConflictException('This business already has an owner.');
    }

    const [updatedClaim, membership] = await this.prisma.$transaction([
      this.prisma.entityClaim.update({
        where: { id: claimId },
        data: { status: 'APPROVED' },
      }),
      this.prisma.entityMembership.create({
        data: {
          userId: claim.userId,
          entityId: claim.entityId,
          role: 'OWNER',
        },
      }),
    ]);

    // 🔒 No more claims — এই business-এর বাকি সব pending claim reject
    await this.prisma.entityClaim.updateMany({
      where: {
        entityId: claim.entityId,
        status: 'PENDING',
        id: { not: claimId },
      },
      data: { status: 'REJECTED' },
    });

    return { claim: updatedClaim, membership };
  }

  async rejectClaim(claimId: string) {
    const claim = await this.prisma.entityClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found.');
    }

    if (claim.status !== 'PENDING') {
      throw new BadRequestException(
        'This claim has already been processed.',
      );
    }

    return this.prisma.entityClaim.update({
      where: { id: claimId },
      data: { status: 'REJECTED' },
    });
  }

  // ─────────────────────────────
  // Helper — অন্য module (যেমন entity-posts) থেকে
  // "এই user কি এই business-এ access রাখে?" চেক করতে ব্যবহার হবে
  // ─────────────────────────────
  async hasAccess(entityId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.entityMembership.findUnique({
      where: {
        userId_entityId: { userId, entityId },
      },
    });

    return !!membership;
  }
}