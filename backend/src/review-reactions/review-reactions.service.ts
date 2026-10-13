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

    // Reaction যে "পরিচয়ে" (personal বা কোনো business) দেওয়া হয়েছে, সেই
    // পরিচয়েই "আমার reaction" হিসেবে দেখায়
    const mine =
      myReaction &&
      (myReaction.entityId ?? null) === (actingEntityId ?? null)
        ? myReaction.type
        : null;

    return {
      total,
      counts,
      myReaction: mine,
    };
  }

  // ─────────────────────────────
  // কে কে react করেছে (Facebook-এর মতো modal-এর জন্য) — নিজেকেও ধরে।
  // Business হিসেবে react করলে business-এর নাম/লোগো (entity) আসে।
  // ─────────────────────────────
  async getReactors(reviewId: string, userId?: string) {
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(userId);

    const rows = await this.prisma.reviewReaction.findMany({
      where: { reviewId, userId: { notIn: hiddenUserIds } },
      select: {
        type: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        entity: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      type: r.type,
      createdAt: r.createdAt,
      entity: r.entity,
    }));
  }
}
