import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ReviewCommentsService } from './review-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Review Comments')
@Controller()
export class ReviewCommentsController {
  constructor(
    private readonly commentsService: ReviewCommentsService,
  ) {}

  @Post('reviews/:reviewId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Post a comment on a review (or a reply, with parentId — max 20 replies per comment)',
  })
  create(
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.create(
      reviewId,
      req.user.userId,
      dto.content,
      dto.parentId,
    );
  }

  @Get('reviews/:reviewId/comments')
  @ApiOperation({
    summary:
      'Get top-level comments with their replies for a review',
  })
  findByReview(
    @Param('reviewId') reviewId: string,
  ) {
    return this.commentsService.findByReview(reviewId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own comment' })
  remove(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.commentsService.remove(
      commentId,
      req.user.userId,
    );
  }
}