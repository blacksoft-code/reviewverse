import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// কত দিনের মধ্যের পোস্ট/রিভিউকে "fresh" ধরা হবে
const FRESHNESS_DAYS = 3;

type FeedRelations = {
  friendIds: string[];
  followedUserIds: string[];
  followedEntityIds: string[];
  blockedUserIds: string[];
  blockedEntityIds: string[];
};

export type FeedItem =
  | {
      type: 'review';
      id: string;
      createdAt: Date;
      priority: number;
      review: {
        id: string;
        rating: number;
        content: string;
        userId: string;
        entityId: string;
        createdAt: Date;
        updatedAt: Date;
        user: { id: string; name: string };
        entity: {
          id: string;
          name: string;
          slug: string;
          location: string | null;
        };
      };
    }
  | {
      type: 'post';
      id: string;
      createdAt: Date;
      priority: number;
      post: {
        id: string;
        content: string;
        image: string | null;
        createdAt: Date;
        entity: {
          id: string;
          name: string;
          slug: string;
          logo: string | null;
        };
      };
    };

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────
  // Friend/follow/block সম্পর্কগুলো বের করা (আগের মতোই)
  // ─────────────────────────────
  private async getRelations(
    userId: string,
  ): Promise<FeedRelations> {
    const [
      friendships,
      followedUsers,
      followedEntities,
      blockedUsers,
      blockedEntities,
    ] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [
            { userId1: userId },
            { userId2: userId },
          ],
        },
        select: { userId1: true, userId2: true },
      }),
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      this.prisma.entityFollow.findMany({
        where: { userId },
        select: { entityId: true },
      }),
      this.prisma.userBlock.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      this.prisma.entityBlock.findMany({
        where: { userId },
        select: { entityId: true },
      }),
    ]);

    const friendIds = friendships.map((f) =>
      f.userId1 === userId ? f.userId2 : f.userId1,
    );

    return {
      friendIds,
      followedUserIds: followedUsers.map(
        (i) => i.followingId,
      ),
      followedEntityIds: followedEntities.map(
        (i) => i.entityId,
      ),
      blockedUserIds: blockedUsers.map(
        (i) => i.blockedId,
      ),
      blockedEntityIds: blockedEntities.map(
        (i) => i.entityId,
      ),
    };
  }

  private priorityForReview(
    review: { userId: string; entityId: string },
    relations: FeedRelations,
  ): number {
    if (relations.friendIds.includes(review.userId)) {
      return 1; // Friends
    }

    if (
      relations.followedUserIds.includes(
        review.userId,
      )
    ) {
      return 2; // Followed user
    }

    if (
      relations.followedEntityIds.includes(
        review.entityId,
      )
    ) {
      return 3; // Followed entity
    }

    return 4; // Everyone else
  }

  private priorityForPost(
    post: { entityId: string },
    relations: FeedRelations,
  ): number {
    // Followed business-এর পোস্ট উপরে থাকবে (review-এর
    // "followed entity" tier-এর সাথে সমান priority)
    if (
      relations.followedEntityIds.includes(
        post.entityId,
      )
    ) {
      return 3;
    }

    return 4; // Non-followed business — এখনো discovery হিসেবে দেখাবে, কিন্তু নিচে
  }

  // ─────────────────────────────
  // মূল feed — pagination + freshness window (fallback সহ)
  // ─────────────────────────────
  async getFeed(
    userId: string,
    skip: number,
    take: number,
  ) {
    const relations = await this.getRelations(userId);

    const [reviews, posts] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          userId: { notIn: relations.blockedUserIds },
          entityId: {
            notIn: relations.blockedEntityIds,
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          entity: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.entityPost.findMany({
        where: {
          entityId: {
            notIn: relations.blockedEntityIds,
          },
        },
        select: {
          id: true,
          content: true,
          image: true,
          createdAt: true,
          entityId: true,
          entity: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      }),
    ]);

    const items: FeedItem[] = [
      ...reviews.map(
        (review): FeedItem => ({
          type: 'review',
          id: review.id,
          createdAt: review.createdAt,
          priority: this.priorityForReview(
            review,
            relations,
          ),
          review,
        }),
      ),
      ...posts.map(
        (post): FeedItem => ({
          type: 'post',
          id: post.id,
          createdAt: post.createdAt,
          priority: this.priorityForPost(
            post,
            relations,
          ),
          post,
        }),
      ),
    ];

    // Priority ASC, তারপর একই priority-তে সবচেয়ে নতুনটা আগে
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return (
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    });

    // ───── Freshness window + fallback ─────
    // আগে "fresh" (গত FRESHNESS_DAYS দিনের) item গুলো, তারপর বাকি
    // পুরনো item গুলো — দুটো গ্রুপের ভেতরেই আগের sort অর্ডার বজায় থাকে
    const freshCutoff = new Date(
      Date.now() -
        FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
    );

    const freshItems = items.filter(
      (i) => i.createdAt >= freshCutoff,
    );
    const staleItems = items.filter(
      (i) => i.createdAt < freshCutoff,
    );

    const ordered = [...freshItems, ...staleItems];

    const page = ordered.slice(skip, skip + take);
    const hasMore = skip + take < ordered.length;

    return {
      items: page,
      hasMore,
      total: ordered.length,
    };
  }

  // ─────────────────────────────
  // Scroll করার মাঝেই friend/followed business-এর নতুন
  // post/review এসেছে কিনা — polling করে চেক করার জন্য
  // ─────────────────────────────
  async getNewSince(userId: string, since: Date) {
    const relations = await this.getRelations(userId);

    const relevantUserIds = [
      ...relations.friendIds,
      ...relations.followedUserIds,
    ];

    const [newReviewsCount, newPostsCount] =
      await Promise.all([
        this.prisma.review.count({
          where: {
            createdAt: { gt: since },
            userId: {
              in: relevantUserIds,
              notIn: relations.blockedUserIds,
            },
            entityId: {
              notIn: relations.blockedEntityIds,
            },
          },
        }),
        this.prisma.entityPost.count({
          where: {
            createdAt: { gt: since },
            entityId: {
              in: relations.followedEntityIds,
              notIn: relations.blockedEntityIds,
            },
          },
        }),
      ]);

    return {
      count: newReviewsCount + newPostsCount,
    };
  }
}