import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const MAX_REPLIES_PER_COMMENT = 20;

@Injectable()
export class ReviewCommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reviewId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (parentId) {
      const parent =
        await this.prisma.reviewComment.findUnique({
          where: { id: parentId },
        });

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

    return this.prisma.reviewComment.create({
      data: {
        content,
        userId,
        reviewId,
        parentId: parentId ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Top-level comment গুলো + প্রতিটার reply (max 20, createdAt asc)
  // এবং total comment count (top-level + সব reply, feed algorithm-এর জন্য)
  async findByReview(reviewId: string) {
    const [comments, totalCount] = await Promise.all([
      this.prisma.reviewComment.findMany({
        where: { reviewId, parentId: null },
        include: {
          user: {
            select: { id: true, name: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reviewComment.count({
        where: { reviewId },
      }),
    ]);

    return { comments, totalCount };
  }

  async remove(commentId: string, userId: string) {
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

    // parent delete হলে replies-ও Cascade-এ চলে যাবে (schema-তে onDelete: Cascade)
    await this.prisma.reviewComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted.' };
  }
}