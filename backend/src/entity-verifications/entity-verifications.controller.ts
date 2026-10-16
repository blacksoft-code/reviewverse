import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { VerificationStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { EntityVerificationsService } from './entity-verifications.service';
import { ApplyVerificationDto } from './dto/apply-verification.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Entity Verifications')
@ApiBearerAuth()
@Controller('entity-verifications')
export class EntityVerificationsController {
  constructor(
    private readonly service: EntityVerificationsService,
  ) {}

  // ───────── Business side ─────────

  @Get('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Verification status + history of a business (members only)',
  })
  getStatus(
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    return this.service.getStatus(entityId, req.user.userId);
  }

  @Post('entity/:entityId/apply')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Apply (or renew) verification with documents — business profile only',
  })
  apply(
    @Param('entityId') entityId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ApplyVerificationDto,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.service.apply(
      entityId,
      req.user.userId,
      actingEntityId,
      files,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Withdraw a pending application' })
  withdraw(
    @Param('id') id: string,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.service.withdraw(id, req.user.userId, actingEntityId);
  }

  // ───────── Admin (verification team) ─────────

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] List verification applications' })
  adminList(@Query('status') status?: VerificationStatus) {
    return this.service.adminList(status);
  }

  @Patch('admin/:id/start-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  startReview(@Param('id') id: string, @Req() req: any) {
    return this.service.startReview(id, req.user.userId);
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.service.approve(id, req.user.userId);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewDecisionDto,
    @Req() req: any,
  ) {
    return this.service.reject(id, req.user.userId, dto.reason);
  }

  @Patch('admin/:id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  revoke(
    @Param('id') id: string,
    @Body() dto: ReviewDecisionDto,
    @Req() req: any,
  ) {
    return this.service.revoke(id, req.user.userId, dto.reason);
  }

  // Decrypt করা document — শুধু Admin। JSON wrapper এড়াতে @Res() দিয়ে সরাসরি পাঠানো।
  @Get('admin/documents/:documentId/file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getDocument(
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, originalName } =
      await this.service.getDocumentForAdmin(
        documentId,
        req.user.userId,
      );

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(originalName)}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(buffer);
  }
}
