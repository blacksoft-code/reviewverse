import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
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

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
    private readonly entityMemberships: EntityMembershipsService,
  ) {}

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

    return this.mediaService.saveMultiple(
      files,
      type,
      refs,
    );
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