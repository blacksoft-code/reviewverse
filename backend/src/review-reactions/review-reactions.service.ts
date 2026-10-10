import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { ReactionType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

@Injectable()
export class ReviewReactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private blocksService: BlocksService,
    private entityMemberships: EntityMembershipsService,
  ) {}

  // একই user আগেও react করে থাকলে টাইপ বদলে যাবে (upsert) —
  // নতুন করে react করলে বা টাইপ বদলালে দুটোই এখান থেকে হয়
  async react(
    reviewId: string,
    userId: string,
    type: ReactionType,
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

    const reaction = await this.prisma.reviewReaction.upsert({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      update: { type, entityId: asEntityId },
      create: { userId, reviewId, type, entityId: asEntityId },
    });

    // business হিসেবে করলে business-এর নামে notification:
    // "biomed reacted to your review."
    const entity = asEntityId
      ? await this.prisma.entity.findUnique({
          where: { id: asEntityId },
          select: { name: true },
        })
      : null;

    await this.notificationsService.notify({
      recipientId: review.userId,
      actorId: entity ? undefined : userId,
      type: 'REVIEW_REACTION',
      message: entity
        ? `${entity.name} reacted to your review.`
        : 'reacted to your review.',
      link: `/entities/${review.entityId}/reviews?reviewId=${review.id}`,
      entityId: review.entityId,
      reviewId: review.id,
    });

    return reaction;
  }

  async unreact(
    reviewId: string,
    userId: string,
    actingEntityId?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { entityId: true },
    });

    if (review) {
      await this.entityMemberships.resolveReviewActor(
        review.entityId,
        userId,
        actingEntityId,
      );
    }

    await this.prisma.reviewReaction.deleteMany({
      where: { userId, reviewId },
    });

    return { message: 'Reaction removed.' };
  }

  // সব টাইপের count + মোট count + এই user-এর নিজের reaction (থাকলে)
  async getSummary(
    reviewId: string,
    userId?: string,
    actingEntityId?: string,
  ) {
    // block থাকলে (দুই দিকেই) ওদের reaction count-এ ধরা হবে না
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(userId);

    const [grouped, myReaction] = await Promise.all([
      this.prisma.reviewReaction.groupBy({
        by: ['type'],
        where: { reviewId, userId: { notIn: hiddenUserIds } },
        _count: { type: true },
      }),
      userId
        ? this.prisma.reviewReaction.findUnique({
            where: {
              userId_reviewId: { userId, reviewId },
            },
            include: {
              review: { select: { entityId: true } },
            },
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

    // Business হিসেবে দেওয়া reaction শুধু ঐ business-এর profile-এ "আমার reaction";
    // personal reaction ঐ business-এর নিজের profile-এ "আমার" হিসেবে ধরা হয় না।
    let mine = myReaction?.type ?? null;

    if (myReaction) {
      const viewingAsOwnerEntity =
        actingEntityId === myReaction.review.entityId;

      if (myReaction.entityId) {
        if (myReaction.entityId !== actingEntityId) mine = null;
      } else if (viewingAsOwnerEntity) {
        mine = null;
      }
    }

    return {
      total,
      counts,
      myReaction: mine,
    };
  }
}