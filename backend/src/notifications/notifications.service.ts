import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

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
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

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
      where: { recipientId: userId },
      include: {
        actor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
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

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read.' };
  }
}
