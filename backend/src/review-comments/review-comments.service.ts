import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

const MAX_REPLIES_PER_COMMENT = 20;

@Injectable()
export class ReviewCommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private blocksService: BlocksService,
    private entityMemberships: EntityMembershipsService,
  ) {}

  // কমেন্টে কে লিখেছে দেখানোর জন্য — business হিসেবে লিখলে business-এর নাম/লোগো
  private readonly authorSelect = {
    user: { select: { id: true, name: true } },
    entity: { select: { id: true, name: true, logo: true, slug: true } },
  } as const;

  async create(
    reviewId: string,
    userId: string,
    content: string,
    parentId?: string,
    actingEntityId?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    // business profile থেকে করলে entityId (নাহলে null)
    const asEntityId =
      await this.entityMemberships.resolveReviewActor(
        review.entityId,
        userId,
        actingEntityId,
      );

    let parentComment: {
      userId: string;
      parentId: string | null;
      entityId: string | null;
    } | null = null;

    if (parentId) {
      const parent =
        await this.prisma.reviewComment.findUnique({
          where: { id: parentId },
        });

      parentComment = parent;

      if (!parent || parent.reviewId !== reviewId) {
        throw new NotFoundException(
          'Parent comment not found.',
        );
      }

      // একটা comment-এর ওপর reply-এর ওপর reply করা যাবে না —
      // সবসময় original top-level comment-এর নিচেই reply যোগ হবে
      if (parent.parentId) {
        throw new ConflictException(
          'You can only reply to a top-level comment.',
        );
      }

      const replyCount =
        await this.prisma.reviewComment.count({
          where: { parentId },
        });

      if (replyCount >= MAX_REPLIES_PER_COMMENT) {
        throw new ConflictException(
          `This comment already has the maximum of ${MAX_REPLIES_PER_COMMENT} replies.`,
        );
      }
    }

    const comment = await this.prisma.reviewComment.create({
      data: {
        content,
        userId,
        reviewId,
        parentId: parentId ?? null,
        entityId: asEntityId,
      },
      include: this.authorSelect,
    });

    const link = `/entities/${review.entityId}/reviews?reviewId=${review.id}`;

    // business হিসেবে করলে notification-এ business-এর নাম যাবে (actorId দেওয়া হয় না,
    // নাহলে owner-এর ব্যক্তিগত নাম দেখাতো): "biomed commented on your review."
    const entityName = comment.entity?.name ?? null;

    if (parentComment?.entityId) {
      // parent comment business-এর (যেমন biomed)। তাই reply-এর notification
      // owner-এর personal bell-এ না গিয়ে ঐ business-এর bell-এ যায় (business-এর
      // সব member পায়), আর link যায় business dashboard-এর Reviews tab-এ।
      // Business নিজেই নিজের comment-এ reply করলে notify করার দরকার নেই।
      if (asEntityId !== parentComment.entityId) {
        const members = await this.prisma.entityMembership.findMany({
          where: { entityId: parentComment.entityId },
          select: { userId: true },
        });

        await this.notificationsService.notifyMany(
          members.map((m) => m.userId),
          {
            actorId: userId,
            type: 'ENTITY_COMMENT_REPLY',
            message: 'replied to your comment.',
            link: `/business/${parentComment.entityId}?tab=reviews&reviewId=${review.id}`,
            entityId: parentComment.entityId,
            reviewId: review.id,
          },
        );
      }
    } else if (parentComment) {
      // reply হলে সরাসরি parent comment-এর মালিককে notify
      await this.notificationsService.notify({
        recipientId: parentComment.userId,
        actorId: entityName ? undefined : userId,
        type: 'REVIEW_REPLY',
        message: entityName
          ? `${entityName} replied to your comment.`
          : 'replied to your comment.',
        link,
        entityId: review.entityId,
        reviewId: review.id,
      });
    } else {
      // top-level comment হলে review-এর মালিককে notify
      await this.notificationsService.notify({
        recipientId: review.userId,
        actorId: entityName ? undefined : userId,
        type: 'REVIEW_COMMENT',
        message: entityName
          ? `${entityName} commented on your review.`
          : 'commented on your review.',
        link,
        entityId: review.entityId,
        reviewId: review.id,
      });
    }

    return comment;
  }

  // Top-level comment গুলো + প্রতিটার reply (max 20, createdAt asc)
  // এবং total comment count (top-level + সব reply, feed algorithm-এর জন্য)
  async findByReview(
    reviewId: string,
    viewerId?: string | null,
  ) {
    // block থাকলে (দুই দিকেই) ওদের comment/reply লুকানো হবে
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(viewerId);

    const [comments, totalCount] = await Promise.all([
      this.prisma.reviewComment.findMany({
        where: {
          reviewId,
          parentId: null,
          userId: { notIn: hiddenUserIds },
        },
        include: {
          ...this.authorSelect,
          replies: {
            where: { userId: { notIn: hiddenUserIds } },
            include: this.authorSelect,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reviewComment.count({
        where: {
          reviewId,
          userId: { notIn: hiddenUserIds },
        },
      }),
    ]);

    return { comments, totalCount };
  }

  async remove(
    commentId: string,
    userId: string,
    actingEntityId?: string,
  ) {
    const comment =
      await this.prisma.reviewComment.findUnique({
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

    // business হিসেবে লেখা comment শুধু ঐ business-এর profile থেকেই মোছা যাবে
    if (
      comment.entityId &&
      comment.entityId !== actingEntityId
    ) {
      throw new ForbiddenException(
        'Switch to this business profile to delete its comment.',
      );
    }

    // parent delete হলে replies-ও Cascade-এ চলে যাবে (schema-তে onDelete: Cascade)
    await this.prisma.reviewComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted.' };
  }
}