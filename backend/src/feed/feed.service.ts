import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getFeed(userId: string) {
    // 1. Current user's relationships বের করি
    const [
      friendships,
      followedUsers,
      followedEntities,
      blockedUsers,
      blockedEntities,
    ] = await Promise.all([
         this.prisma.friendship.findMany({
        where: {
          OR: [{ userId1: userId }, { userId2: userId }],
        },
        select: { userId1: true, userId2: true },
      }),
      this.prisma.userFollow.findMany({
        where: {
          followerId: userId,
        },
        select: {
          followingId: true,
        },
      }),

      this.prisma.entityFollow.findMany({
        where: {
          userId,
        },
        select: {
          entityId: true,
        },
      }),

      this.prisma.userBlock.findMany({
        where: {
          blockerId: userId,
        },
        select: {
          blockedId: true,
        },
      }),

      this.prisma.entityBlock.findMany({
        where: {
          userId,
        },
        select: {
          entityId: true,
        },
      }),
    ]);

    // Friendship মিউচুয়াল, তাই userId1/userId2 যেকোনো একটা "আমি" হতে পারি —
    // অন্যপাশেরটাই friend
    const friendIds = friendships.map((f) =>
      f.userId1 === userId ? f.userId2 : f.userId1,
    );

    const followedUserIds =
      followedUsers.map(
        (item) => item.followingId,
      );

    const followedEntityIds =
      followedEntities.map(
        (item) => item.entityId,
      );

    const blockedUserIds =
      blockedUsers.map(
        (item) => item.blockedId,
      );

    const blockedEntityIds =
      blockedEntities.map(
        (item) => item.entityId,
      );

    // 2. Blocked user/entity-এর reviews বাদ দিয়ে
    // সব public reviews নিয়ে আসি
    const reviews =
      await this.prisma.review.findMany({
        where: {
          userId: {
            notIn: blockedUserIds,
          },
          entityId: {
            notIn: blockedEntityIds,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          entity: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    // 3. প্রতিটি review-এর priority determine করি
    const feed = reviews.map((review) => {
      let priority = 4;

      if (friendIds.includes(review.userId)) {
        priority = 1; // Friends
      }

      // Followed user's review
      if (followedUserIds.includes(review.userId)) {
        priority = 2;
      }

      // Followed entity's review
      else if (
        followedEntityIds.includes(review.entityId,)) {
        priority = 3;
      }

      return {
        ...review,
        priority,
      };
    });

    // 4. Priority ASC
    // এবং একই priority-এর মধ্যে latest first
    feed.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });

    return feed;
  }
}