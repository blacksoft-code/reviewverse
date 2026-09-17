import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ReactionType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewReactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // একই user আগেও react করে থাকলে টাইপ বদলে যাবে (upsert) —
  // নতুন করে react করলে বা টাইপ বদলালে দুটোই এখান থেকে হয়
  async react(
    reviewId: string,
    userId: string,
    type: ReactionType,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    const reaction = await this.prisma.reviewReaction.upsert({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      update: { type },
      create: { userId, reviewId, type },
    });

    await this.notificationsService.notify({
      recipientId: review.userId,
      actorId: userId,
      type: 'REVIEW_REACTION',
      message: 'reacted to your review.',
      link: `/entities/${review.entityId}/reviews?reviewId=${review.id}`,
      entityId: review.entityId,
      reviewId: review.id,
    });

    return reaction;
  }

  async unreact(reviewId: string, userId: string) {
    await this.prisma.reviewReaction.deleteMany({
      where: { userId, reviewId },
    });

    return { message: 'Reaction removed.' };
  }

  // সব টাইপের count + মোট count + এই user-এর নিজের reaction (থাকলে)
  async getSummary(
    reviewId: string,
    userId?: string,
  ) {
    const [grouped, myReaction] = await Promise.all([
      this.prisma.reviewReaction.groupBy({
        by: ['type'],
        where: { reviewId },
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

    return {
      total,
      counts,
      myReaction: myReaction?.type ?? null,
    };
  }
}