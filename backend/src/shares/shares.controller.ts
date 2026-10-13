import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SharesService } from './shares.service';
import { ShareEngagementService } from './share-engagement.service';
import { CreateShareDto } from './dto/create-share.dto';
import { ReactToShareDto } from './dto/react-to-share.dto';
import { CreateShareCommentDto } from './dto/create-share-comment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Shares')
@Controller('shares')
export class SharesController {
  constructor(
    private readonly sharesService: SharesService,
    private readonly engagement: ShareEngagementService,
  ) {}

  // ── NB: নির্দিষ্ট path (summary, user/:id, comments/:id) সবসময় ':id'-এর আগে ──

  @Get('summary')
  @ApiOperation({
    summary: 'Total share count of a review or an entity post',
  })
  summary(
    @Query('reviewId') reviewId?: string,
    @Query('entityPostId') entityPostId?: string,
  ) {
    return this.sharesService.getSummary(reviewId, entityPostId);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'All shares of a user (profile Shares tab)' })
  findByUser(@Param('userId') userId: string, @Req() req: any) {
    return this.sharesService.findByUser(
      userId,
      req.user?.userId ?? null,
    );
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own comment on a share' })
  removeComment(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.engagement.removeComment(commentId, req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Share a review or an entity post (personal profile only, optional caption max 500)',
  })
  create(
    @Body() dto: CreateShareDto,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.sharesService.create(
      req.user.userId,
      dto,
      actingEntityId,
    );
  }

  @Get(':shareId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get one share with the original content' })
  findOne(@Param('shareId') shareId: string, @Req() req: any) {
    return this.sharesService.findOne(
      shareId,
      req.user?.userId ?? null,
    );
  }

  @Delete(':shareId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own share' })
  remove(@Param('shareId') shareId: string, @Req() req: any) {
    return this.sharesService.remove(shareId, req.user.userId);
  }

  // ── reactions ──

  @Post(':shareId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  react(
    @Param('shareId') shareId: string,
    @Body() dto: ReactToShareDto,
    @Req() req: any,
  ) {
    return this.engagement.react(shareId, req.user.userId, dto.type);
  }

  @Delete(':shareId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unreact(@Param('shareId') shareId: string, @Req() req: any) {
    return this.engagement.unreact(shareId, req.user.userId);
  }

  @Get(':shareId/reactions/summary')
  @UseGuards(OptionalJwtAuthGuard)
  reactionSummary(
    @Param('shareId') shareId: string,
    @Req() req: any,
  ) {
    return this.engagement.getReactionSummary(
      shareId,
      req.user?.userId,
    );
  }

  @Get(':shareId/reactions/users')
  @UseGuards(OptionalJwtAuthGuard)
  reactors(@Param('shareId') shareId: string, @Req() req: any) {
    return this.engagement.getReactors(shareId, req.user?.userId);
  }

  // ── comments ──

  @Post(':shareId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createComment(
    @Param('shareId') shareId: string,
    @Body() dto: CreateShareCommentDto,
    @Req() req: any,
  ) {
    return this.engagement.createComment(
      shareId,
      req.user.userId,
      dto.content,
      dto.parentId,
    );
  }

  @Get(':shareId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  findComments(@Param('shareId') shareId: string, @Req() req: any) {
    return this.engagement.findComments(
      shareId,
      req.user?.userId ?? null,
    );
  }
}
