import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ReactionType } from '@prisma/client';

@Injectable()
export class PostReactionsService {
  constructor(private prisma: PrismaService) {}

  async react(
    postId: string,
    userId: string,
    type: ReactionType,
  ) {
    const post = await this.prisma.entityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return this.prisma.postReaction.upsert({
      where: {
        userId_postId: { userId, postId },
      },
      update: { type },
      create: { userId, postId, type },
    });
  }

  async unreact(postId: string, userId: string) {
    await this.prisma.postReaction.deleteMany({
      where: { userId, postId },
    });

    return { message: 'Reaction removed.' };
  }

  async getSummary(postId: string, userId?: string) {
    const [grouped, myReaction] = await Promise.all([
      this.prisma.postReaction.groupBy({
        by: ['type'],
        where: { postId },
        _count: { type: true },
      }),
      userId
        ? this.prisma.postReaction.findUnique({
            where: {
              userId_postId: { userId, postId },
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