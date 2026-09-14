import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const MAX_REPLIES_PER_COMMENT = 20;

@Injectable()
export class PostCommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    postId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.prisma.entityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (parentId) {
      const parent =
        await this.prisma.postComment.findUnique({
          where: { id: parentId },
        });

      if (!parent || parent.postId !== postId) {
        throw new NotFoundException(
          'Parent comment not found.',
        );
      }

      if (parent.parentId) {
        throw new ConflictException(
          'You can only reply to a top-level comment.',
        );
      }

      const replyCount =
        await this.prisma.postComment.count({
          where: { parentId },
        });

      if (replyCount >= MAX_REPLIES_PER_COMMENT) {
        throw new ConflictException(
          `This comment already has the maximum of ${MAX_REPLIES_PER_COMMENT} replies.`,
        );
      }
    }

    return this.prisma.postComment.create({
      data: {
        content,
        userId,
        postId,
        parentId: parentId ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findByPost(postId: string) {
    const [comments, totalCount] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId, parentId: null },
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
      this.prisma.postComment.count({
        where: { postId },
      }),
    ]);

    return { comments, totalCount };
  }

  async remove(commentId: string, userId: string) {
    const comment =
      await this.prisma.postComment.findUnique({
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

    await this.prisma.postComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted.' };
  }
}