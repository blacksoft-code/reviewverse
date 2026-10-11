import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReactionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_REPLIES_PER_COMMENT = 20;

// Share-এর reaction ও comment, আর তার notification।
// নিয়ম: এই সব notification শুধু যে share করেছে তার কাছে যায় —
// মূল review/post-এর author বা entity কিছু পায় না।
@Injectable()
export class ShareEngagementService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private blocksService: BlocksService,
  ) {}

  private async getShare(shareId: string) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      select: {
        id: true,
        userId: true,
        reviewId: true,
        entityPostId: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    return share;
  }

  private kind(share: { reviewId: string | null }) {
    return share.reviewId ? 'review' : 'post';
  }

  // ─────────────────────────────
  // REACTIONS
  // ─────────────────────────────
  async react(shareId: string, userId: string, type: ReactionType) {
    const share = await this.getShare(shareId);

    const reaction = await this.prisma.shareReaction.upsert({
      where: { userId_shareId: { userId, shareId } },
      update: { type },
      create: { userId, shareId, type },
    });

    await this.notificationsService.notify({
      recipientId: share.userId,
      actorId: userId,
      type: 'SHARE_REACTION',
      message: `reacted to your shared ${this.kind(share)}.`,
      link: `/shares/${share.id}`,
    });

    return reaction;
  }

  async unreact(shareId: string, userId: string) {
    await this.prisma.shareReaction.deleteMany({
      where: { userId, shareId },
    });

    return { message: 'Reaction removed.' };
  }

  async getReactionSummary(shareId: string, userId?: string) {
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(userId);

    const [grouped, myReaction] = await Promise.all([
      this.prisma.shareReaction.groupBy({
        by: ['type'],
        where: { shareId, userId: { notIn: hiddenUserIds } },
        _count: { type: true },
      }),
      userId
        ? this.prisma.shareReaction.findUnique({
            where: { userId_shareId: { userId, shareId } },
          })
        : Promise.resolve(null),
    ]);

    const counts: Record<ReactionType, number> = {
      HELPFUL: 0,
      LOVE: 0,
      ACCURATE: 0,
      HAHA: 0,
      DISLIKE: 0,
    };

    let total = 0;

    for (const g of grouped) {
      counts[g.type] = g._count.type;
      total += g._count.type;
    }

    return {
      total,
      counts,
      myReaction: myReaction?.type ?? null,
    };
  }

  // ─────────────────────────────
  // COMMENTS
  // ─────────────────────────────
  async createComment(
    shareId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    const share = await this.getShare(shareId);

    let parentComment: {
      userId: string;
      parentId: string | null;
    } | null = null;

    if (parentId) {
      const parent = await this.prisma.shareComment.findUnique({
        where: { id: parentId },
      });

      if (!parent || parent.shareId !== shareId) {
        throw new NotFoundException('Parent comment not found.');
      }

      if (parent.parentId) {
        throw new ConflictException(
          'You can only reply to a top-level comment.',
        );
      }

      const replyCount = await this.prisma.shareComment.count({
        where: { parentId },
      });

      if (replyCount >= MAX_REPLIES_PER_COMMENT) {
        throw new ConflictException(
          `This comment already has the maximum of ${MAX_REPLIES_PER_COMMENT} replies.`,
        );
      }

      parentComment = parent;
    }

    const comment = await this.prisma.shareComment.create({
      data: {
        content,
        userId,
        shareId,
        parentId: parentId ?? null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const link = `/shares/${share.id}`;

    if (parentComment) {
      await this.notificationsService.notify({
        recipientId: parentComment.userId,
        actorId: userId,
        type: 'SHARE_REPLY',
        message: 'replied to your comment.',
        link,
      });
    } else {
      await this.notificationsService.notify({
        recipientId: share.userId,
        actorId: userId,
        type: 'SHARE_COMMENT',
        message: `commented on your shared ${this.kind(share)}.`,
        link,
      });
    }

    return comment;
  }

  async findComments(shareId: string, viewerId?: string | null) {
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(viewerId);

    const [comments, totalCount] = await Promise.all([
      this.prisma.shareComment.findMany({
        where: {
          shareId,
          parentId: null,
          userId: { notIn: hiddenUserIds },
        },
        include: {
          user: { select: { id: true, name: true } },
          replies: {
            where: { userId: { notIn: hiddenUserIds } },
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shareComment.count({
        where: { shareId, userId: { notIn: hiddenUserIds } },
      }),
    ]);

    return { comments, totalCount };
  }

  async removeComment(commentId: string, userId: string) {
    const comment = await this.prisma.shareComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comment.',
      );
    }

    await this.prisma.shareComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted.' };
  }
}
