import { 
  Injectable,
  ForbiddenException,
  NotFoundException, 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Rating recalculation — এই একটা জায়গা থেকেই create/update/delete
   * সবার rating সঠিক থাকবে।
   *
   * - Offering average: ঐ offering-এ সব user-এর isLatest=true review নিয়ে
   *   simple average।
   * - Entity average: প্রথমে প্রতি user-এর নিজের সব isLatest=true review
   *   (যেকোনো offering + general, সবগুলো মিলিয়ে) থেকে তার personal average
   *   বের করা হয়, তারপর সব user-এর personal average মিলিয়ে entity average।
   *   এতে বেশি item review করা user-এর ভোট ভারী হয়ে যায় না — প্রতি user
   *   = ১ ভোট, entity rating-এ।
   */
  private async recalculateRatings(
    entityId: string,
    offeringId?: string | null,
  ) {
    if (offeringId) {
      const offeringReviews = await this.prisma.review.findMany({
        where: { offeringId, isLatest: true },
        select: { rating: true },
      });

      const offeringAverage =
        offeringReviews.length > 0
          ? offeringReviews.reduce((sum, r) => sum + r.rating, 0) /
            offeringReviews.length
          : 0;

      await this.prisma.offering.update({
        where: { id: offeringId },
        data: { averageRating: offeringAverage },
      });
    }

    const entityReviews = await this.prisma.review.findMany({
      where: { entityId, isLatest: true },
      select: { userId: true, rating: true },
    });

    // প্রতি user-এর জন্য তার সব latest review-এর sum/count জমা করা
    const perUserTotals = new Map<
      string,
      { sum: number; count: number }
    >();
    for (const r of entityReviews) {
      const existing = perUserTotals.get(r.userId) ?? {
        sum: 0,
        count: 0,
      };
      existing.sum += r.rating;
      existing.count += 1;
      perUserTotals.set(r.userId, existing);
    }

    const personalAverages = Array.from(
      perUserTotals.values(),
    ).map(({ sum, count }) => sum / count);

    const entityAverage =
      personalAverages.length > 0
        ? personalAverages.reduce((sum, avg) => sum + avg, 0) /
          personalAverages.length
        : 0;

    await this.prisma.entity.update({
      where: { id: entityId },
      data: { averageRating: entityAverage },
    });
  }

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    console.log('CREATE REVIEW CALLED');

    // এই user আগে এই একই entity-তে, একই item (বা item ছাড়া general review
    // হিসেবে) কোনো review দিয়ে থাকলে সেটাকে আর "latest" ধরা হবে না —
    // rating calculation-এ শুধু নিচে তৈরি হওয়া নতুন review-টাই গণনা হবে।
    // পুরনো review row মুছে ফেলা হচ্ছে না, শুধু isLatest = false হচ্ছে,
    // তাই "more..."-এ history হিসেবে দেখানো যাবে।
    await this.prisma.review.updateMany({
      where: {
        userId,
        entityId: createReviewDto.entityId,
        offeringId: createReviewDto.offeringId ?? null,
        isLatest: true,
      },
      data: {
        isLatest: false,
      },
    });

    const review = await this.prisma.review.create({
      data: {
        rating: createReviewDto.rating,
        content: createReviewDto.content,
        userId,
        entityId: createReviewDto.entityId,
        offeringId: createReviewDto.offeringId ?? null,
        isLatest: true,
      },
    });

    console.log('REVIEW CREATED:', review);

    await this.recalculateRatings(
      createReviewDto.entityId,
      createReviewDto.offeringId ?? null,
    );

    // entity-র owner/admin/editor সবাইকে নতুন review-এর notification
    const owners = await this.prisma.entityMembership.findMany({
      where: { entityId: createReviewDto.entityId },
      select: { userId: true },
    });

    await this.notificationsService.notifyMany(
      owners.map((o) => o.userId),
      {
        actorId: userId,
        type: 'NEW_REVIEW',
        message: 'somebody left a new review on your business.',
        link: `/entities/${createReviewDto.entityId}/reviews?reviewId=${review.id}`,
        entityId: createReviewDto.entityId,
        reviewId: review.id,
      },
    );

    return review;
  }

async findByEntity(entityId: string) {
  return this.prisma.review.findMany({
    where: {
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      offering: {
        select: {
          id: true,
          name: true,
        },
      },
      media: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
//update method  

async update(
  userId: string,
  reviewId: string,
  updateReviewDto: UpdateReviewDto,
) {
  const existingReview =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!existingReview) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (existingReview.userId !== userId) {
    throw new ForbiddenException(
      'You can only update your own review',
    );
  }

  const review = await this.prisma.review.update({
    where: {
      id: reviewId,
    },
    data: updateReviewDto,
  });

  // শুধু rating/content বদলাচ্ছে (item বদলানো যায় না update-এ), তাই
  // recalculation দরকার শুধু তখনই যখন এই review-টাই এখনো "latest" —
  // পুরনো (isLatest=false) কোনো review edit হলে সেটা rating-এ ধরাই হয় না,
  // তাই recalculate করারও দরকার নেই।
  if (review.isLatest) {
    await this.recalculateRatings(
      review.entityId,
      review.offeringId,
    );
  }

  return review;
}


//review delete feature
async delete(
  userId: string,
  reviewId: string,
) {
  const review =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!review) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (review.userId !== userId) {
    throw new ForbiddenException(
      'You can only delete your own review',
    );
  }

  await this.prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  // যদি delete হওয়া review-টাই "latest" ছিলো, তাহলে এই user-এর এই
  // (entity, offering) কম্বিনেশনে যদি আরও পুরনো review থাকে, সেটাকে
  // আবার "latest" বানিয়ে দিচ্ছি — নাহলে সবচেয়ে নতুন review মুছে ফেললে
  // user-এর আগের ভালো review-টাও (যেটা এখনো relevant) হারিয়ে যেত।
  // এই promoted review-টা response-এ ফেরত পাঠাচ্ছি, যাতে frontend
  // আবার পুরো list fetch না করেই local state ঠিক করে নিতে পারে।
  let promotedReview: Review | null = null;

  if (review.isLatest) {
    const previousReview = await this.prisma.review.findFirst({
      where: {
        userId: review.userId,
        entityId: review.entityId,
        offeringId: review.offeringId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (previousReview) {
      promotedReview = await this.prisma.review.update({
        where: { id: previousReview.id },
        data: { isLatest: true },
      });
    }
  }

  await this.recalculateRatings(review.entityId, review.offeringId);

  return {
    message: 'Review deleted successfully',
    promotedReview,
  };
}

}