import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaType } from '@prisma/client';

import { MediaService, MediaRefs } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// একটা review-তে সর্বোচ্চ কয়টা ছবি থাকতে পারবে
const MAX_REVIEW_PHOTOS = 10;

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
    private readonly entityMemberships: EntityMembershipsService,
  ) {}

  // ── Photos tab (public) ──

  @Get('user/:userId')
  getUserPhotos(@Param('userId') userId: string) {
    return this.mediaService.getUserPhotos(userId);
  }

  @Get('entity/:entityId')
  getEntityPhotos(@Param('entityId') entityId: string) {
    return this.mediaService.getEntityPhotos(entityId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FILE_SIZE_LIMIT },
    }),
  )

  @ApiConsumes('multipart/form-data')
@ApiBearerAuth()
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
      type: {
        type: 'string',
        enum: [
          'USER_PROFILE',
          'USER_COVER',
          'ENTITY_LOGO',
          'ENTITY_COVER',
          'REVIEW',
          'ENTITY_POST',
          'OFFERING',
        ],
      },
      targetId: { type: 'string' },
    },
    required: ['file', 'type', 'targetId'],
  },
})
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: MediaType,
    @Body('targetId') targetId: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Image file is required',
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Only image files are allowed',
      );
    }

    if (!type || !targetId) {
      throw new BadRequestException(
        'type and targetId are required',
      );
    }

    const refs = await this.resolveRefs(
      type,
      targetId,
      req.user.userId,
    );

    await this.assertReviewPhotoLimit(type, refs, 1);

    return this.mediaService.saveMedia(
      file.buffer,
      type,
      refs,
    );
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: FILE_SIZE_LIMIT },
    }),
  )

  @ApiConsumes('multipart/form-data')
@ApiBearerAuth()
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
      },
      type: {
        type: 'string',
        enum: [
          'USER_PROFILE',
          'USER_COVER',
          'ENTITY_LOGO',
          'ENTITY_COVER',
          'REVIEW',
          'ENTITY_POST',
          'OFFERING',
        ],
      },
      targetId: { type: 'string' },
    },
    required: ['files', 'type', 'targetId'],
  },
})

  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: MediaType,
    @Body('targetId') targetId: string,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one image file is required',
      );
    }

    if (files.length > 10) {
      throw new BadRequestException(
        'Maximum 10 photos allowed',
      );
    }

    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          'Only image files are allowed',
        );
      }
    }

    if (!type || !targetId) {
      throw new BadRequestException(
        'type and targetId are required',
      );
    }

    const refs = await this.resolveRefs(
      type,
      targetId,
      req.user.userId,
    );

    // Edit-এর সময় আগের ছবির সাথে যোগ করলে যেন মোট ১০টা ছাড়িয়ে না যায়
    await this.assertReviewPhotoLimit(
      type,
      refs,
      files.length,
    );

    return this.mediaService.saveMultiple(
      files,
      type,
      refs,
    );
  }

  // ─────────────────────────────
  // Review-এর একটা ছবি মুছে ফেলা — শুধু review-এর মালিক পারবে
  // (Review edit করার সময় ✕ চাপলে এটা call হয়)
  // ─────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteReviewPhoto(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Photo not found.');
    }

    // এখন শুধু review-এর ছবি মোছা যায়
    if (media.type !== 'REVIEW' || !media.reviewId) {
      throw new BadRequestException(
        'Only review photos can be deleted here.',
      );
    }

    const review = await this.prisma.review.findUnique({
      where: { id: media.reviewId },
      select: { userId: true },
    });

    if (!review || review.userId !== req.user.userId) {
      throw new ForbiddenException(
        'You can only delete photos from your own review.',
      );
    }

    await this.mediaService.deleteMedia(id);

    return { id, deleted: true };
  }

  // Review-এ আগে থেকে যতগুলো ছবি আছে + নতুন যতগুলো আসছে — মোট ১০-এর বেশি না
  private async assertReviewPhotoLimit(
    type: MediaType,
    refs: MediaRefs,
    incoming: number,
  ) {
    if (type !== 'REVIEW' || !refs.reviewId) return;

    const existing = await this.prisma.media.count({
      where: { reviewId: refs.reviewId, type: 'REVIEW' },
    });

    if (existing + incoming > MAX_REVIEW_PHOTOS) {
      const remaining = Math.max(
        0,
        MAX_REVIEW_PHOTOS - existing,
      );

      throw new BadRequestException(
        `A review can have at most ${MAX_REVIEW_PHOTOS} photos. You can add ${remaining} more.`,
      );
    }
  }

  // ─────────────────────────────
  // type + targetId থেকে সঠিক FK বের করা, সাথে সাথে
  // "এই user কি এটা upload করার অধিকার রাখে" চেক করা
  // ─────────────────────────────
  private async resolveRefs(
    type: MediaType,
    targetId: string,
    userId: string,
  ): Promise<MediaRefs> {
    switch (type) {
      case 'USER_PROFILE':
      case 'USER_COVER': {
        // নিজের প্রোফাইল ছাড়া অন্য কারো profile/cover বসানো যাবে না
        if (targetId !== userId) {
          throw new ForbiddenException(
            'You can only update your own profile/cover photo.',
          );
        }
        return { userId: targetId };
      }

      case 'ENTITY_LOGO':
      case 'ENTITY_COVER': {
        const hasAccess =
          await this.entityMemberships.hasAccess(
            targetId,
            userId,
          );

        if (!hasAccess) {
          throw new ForbiddenException(
            'Only the business owner, manager, or employee can update this.',
          );
        }
        return { entityId: targetId };
      }

      case 'REVIEW': {
        const review =
          await this.prisma.review.findUnique({
            where: { id: targetId },
          });

        if (!review) {
          throw new NotFoundException(
            'Review not found.',
          );
        }

        if (review.userId !== userId) {
          throw new ForbiddenException(
            'You can only attach photos to your own review.',
          );
        }
        return { reviewId: targetId };
      }

      case 'ENTITY_POST': {
        const post =
          await this.prisma.entityPost.findUnique({
            where: { id: targetId },
          });

        if (!post) {
          throw new NotFoundException(
            'Post not found.',
          );
        }

        const hasAccess =
          await this.entityMemberships.hasAccess(
            post.entityId,
            userId,
          );

        if (!hasAccess) {
          throw new ForbiddenException(
            'Only the business owner, manager, or employee can attach photos to this post.',
          );
        }
        return { entityPostId: targetId };
      }

      case 'OFFERING': {
        const offering =
          await this.prisma.offering.findUnique({
            where: { id: targetId },
          });

        if (!offering) {
          throw new NotFoundException(
            'Offering not found.',
          );
        }

        const hasAccess =
          await this.entityMemberships.hasAccess(
            offering.entityId,
            userId,
          );

        if (!hasAccess) {
          throw new ForbiddenException(
            'Only the business owner, manager, or employee can attach a photo to this offering.',
          );
        }
        return { offeringId: targetId };
      }

      default:
        throw new BadRequestException(
          'Invalid media type.',
        );
    }
  }
}