import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

// Notification history কতদিন থাকবে — এর পুরনোগুলো auto delete হয়ে যায়
export const NOTIFICATION_RETENTION_DAYS = 30;

// কত ঘণ্টা পরপর পুরনো notification মুছে ফেলার job চলবে
const CLEANUP_INTERVAL_HOURS = 6;

// এই টাইপগুলো business-এর (frontend NotificationBell-এর তালিকার সাথে মিল রাখা)
const BUSINESS_NOTIFICATION_TYPES: NotificationType[] = [
  'NEW_REVIEW',
  'NEW_ENTITY_FOLLOWER',
  'POST_REACTION',
  'POST_COMMENT',
  'POST_REPLY',
  'CLAIM_APPROVED',
  'CLAIM_REJECTED',
  'QUESTION_ASKED',
];

interface NotifyParams {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  message: string;
  link?: string;
  entityId?: string;
  reviewId?: string;
  postId?: string;
}

@Injectable()
export class NotificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    NotificationsService.name,
  );

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  // ───────────── ৩০ দিনের retention + auto delete ─────────────

  private retentionCutoff() {
    return new Date(
      Date.now() -
        NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  // Server চালু হলে একবার, তারপর প্রতি ৬ ঘণ্টায় পুরনো notification মুছবে।
  // (আলাদা scheduler package লাগে না — idempotent, তাই একাধিক instance চললেও সমস্যা নেই)
  onModuleInit() {
    this.deleteExpired();

    this.cleanupTimer = setInterval(
      () => this.deleteExpired(),
      CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000,
    );

    // এই timer যেন process বন্ধ হতে বাধা না দেয়
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async deleteExpired() {
    try {
      const { count } =
        await this.prisma.notification.deleteMany({
          where: { createdAt: { lt: this.retentionCutoff() } },
        });

      if (count > 0) {
        this.logger.log(
          `Deleted ${count} notification(s) older than ${NOTIFICATION_RETENTION_DAYS} days`,
        );
      }

      return count;
    } catch (error) {
      this.logger.error(
        'Failed to delete expired notifications',
        error as Error,
      );

      return 0;
    }
  }

  async notify(params: NotifyParams) {
    // নিজের action-এ নিজেকে notify করার দরকার নেই
    if (params.actorId && params.actorId === params.recipientId) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        actorId: params.actorId,
        type: params.type,
        message: params.message,
        link: params.link,
        entityId: params.entityId,
        reviewId: params.reviewId,
        postId: params.postId,
      },
      include: {
        actor: { select: { id: true, name: true } },
      },
    });

    this.gateway.sendToUser(params.recipientId, notification);

    return notification;
  }

  // একসাথে একাধিক recipient-কে notify করতে (যেমন একটা entity-র সব owner/editor)
  async notifyMany(
    recipientIds: string[],
    params: Omit<NotifyParams, 'recipientId'>,
  ) {
    const uniqueRecipients = [...new Set(recipientIds)];

    await Promise.all(
      uniqueRecipients.map((recipientId) =>
        this.notify({ ...params, recipientId }),
      ),
    );
  }

  async findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        createdAt: { gte: this.retentionCutoff() },
      },
      include: {
        actor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Bell-এর "See all" পেজের জন্য — গত ৩০ দিনের পুরো history, পেজ ধরে ধরে।
  // entityId দিলে সেই business-এর business-notification, না দিলে personal notification
  // (frontend bell-এর business/personal mode-এর মতোই)
  async findHistory(
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      entityId?: string;
    },
  ) {
    const limit = Math.min(
      Math.max(options.limit ?? 20, 1),
      50,
    );

    const scope = options.entityId
      ? {
          type: { in: BUSINESS_NOTIFICATION_TYPES },
          entityId: options.entityId,
        }
      : { type: { notIn: BUSINESS_NOTIFICATION_TYPES } };

    const rows = await this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        createdAt: { gte: this.retentionCutoff() },
        ...scope,
      },
      include: {
        actor: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      retentionDays: NOTIFICATION_RETENTION_DAYS,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
        createdAt: { gte: this.retentionCutoff() },
      },
    });

    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });

    return { message: 'Marked as read.' };
  }

  // scope না দিলে আগের মতোই সব read; entityId দিলে শুধু ঐ business-এর,
  // scope=personal দিলে শুধু personal notification
  async markAllAsRead(
    userId: string,
    options: { entityId?: string; scope?: string } = {},
  ) {
    const scope = options.entityId
      ? {
          type: { in: BUSINESS_NOTIFICATION_TYPES },
          entityId: options.entityId,
        }
      : options.scope === 'personal'
        ? { type: { notIn: BUSINESS_NOTIFICATION_TYPES } }
        : {};

    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false, ...scope },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read.' };
  }
}