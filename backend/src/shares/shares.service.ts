import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateShareDto } from './dto/create-share.dto';
import { SHARE_INCLUDE, toShareDto } from './share.helpers';

@Injectable()
export class SharesService {
  constructor(
    private prisma: PrismaService,
    private blocksService: BlocksService,
    private notificationsService: NotificationsService,
  ) {}

  // ─────────────────────────────
  // মূল review/post-এ "মোট কতবার share হয়েছে" (public)
  // ─────────────────────────────
  async getSummary(reviewId?: string, entityPostId?: string) {
    if (!reviewId === !entityPostId) {
      throw new BadRequestException(
        'Provide either reviewId or entityPostId.',
      );
    }

    const count = await this.prisma.share.count({
      where: reviewId ? { reviewId } : { entityPostId },
    });

    return { count };
  }

  // ─────────────────────────────
  // SHARE — যেকোনো লগইন করা user, personal profile থেকে
  // ─────────────────────────────
  async create(
    userId: string,
    dto: CreateShareDto,
    actingEntityId?: string,
  ) {
    // Share একটা personal কাজ — business profile (entity mode) থেকে নয়
    if (actingEntityId) {
      throw new ForbiddenException(
        'Sharing is a personal action. Switch back to your personal profile to share.',
      );
    }

    const { reviewId, entityPostId } = dto;

    if (!reviewId === !entityPostId) {
      throw new BadRequestException(
        'Provide either reviewId or entityPostId.',
      );
    }

    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(userId);

    let entityId: string;

    if (reviewId) {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { userId: true, entityId: true },
      });

      if (!review) {
        throw new NotFoundException('Review not found.');
      }

      if (hiddenUserIds.includes(review.userId)) {
        throw new ForbiddenException(
          'You cannot share this review.',
        );
      }

      entityId = review.entityId;
    } else {
      const post = await this.prisma.entityPost.findUnique({
        where: { id: entityPostId },
        select: { entityId: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found.');
      }

      entityId = post.entityId;
    }

    const blockedEntity =
      await this.prisma.entityBlock.findUnique({
        where: { userId_entityId: { userId, entityId } },
      });

    if (blockedEntity) {
      throw new ForbiddenException(
        'You cannot share content from a business you blocked.',
      );
    }

    const share = await this.prisma.share.create({
      data: {
        userId,
        reviewId,
        entityPostId,
        caption: dto.caption?.trim() || null,
      },
      include: SHARE_INCLUDE,
    });

    // মূল author-কে জানানো: "rock shared your review/post"
    // (share-এর reaction/comment-এর notification আলাদা — সেগুলো শুধু sharer পায়)
    if (reviewId) {
      const review = share.review;

      if (review) {
        await this.notificationsService.notify({
          recipientId: review.userId,
          actorId: userId,
          type: 'REVIEW_SHARED',
          message: 'shared your review.',
          link: `/entities/${review.entityId}/reviews?reviewId=${review.id}`,
          entityId: review.entityId,
          reviewId: review.id,
        });
      }
    } else if (entityPostId) {
      // Post-এর মালিক business — তাই business-এর সব member-কে (business bell-এ)
      const members = await this.prisma.entityMembership.findMany({
        where: { entityId },
        select: { userId: true },
      });

      await this.notificationsService.notifyMany(
        members.map((m) => m.userId),
        {
          actorId: userId,
          type: 'POST_SHARED',
          message: 'shared your post.',
          link: `/business/${entityId}?tab=posts&postId=${entityPostId}`,
          entityId,
          postId: entityPostId,
        },
      );
    }

    return toShareDto(share);
  }

  // ─────────────────────────────
  // একটা share (notification link / share page) — public
  // ─────────────────────────────
  async findOne(shareId: string, viewerId?: string | null) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: SHARE_INCLUDE,
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(viewerId);

    if (hiddenUserIds.includes(share.userId)) {
      throw new NotFoundException('Share not found.');
    }

    return toShareDto(share);
  }

  // ─────────────────────────────
  // কোনো user-এর সব share (profile-এর Shares tab) — public
  // ─────────────────────────────
  async findByUser(userId: string, viewerId?: string | null) {
    const hiddenUserIds =
      await this.blocksService.getHiddenUserIds(viewerId);

    if (hiddenUserIds.includes(userId)) {
      return [];
    }

    const shares = await this.prisma.share.findMany({
      where: { userId },
      include: SHARE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return shares
      .filter(
        (s) =>
          !(s.review && hiddenUserIds.includes(s.review.userId)),
      )
      .map(toShareDto);
  }

  // ─────────────────────────────
  // নিজের share মুছে ফেলা
  // ─────────────────────────────
  async remove(shareId: string, userId: string) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      select: { userId: true },
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    if (share.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own share.',
      );
    }

    await this.prisma.share.delete({ where: { id: shareId } });

    return { message: 'Share deleted.' };
  }
}
