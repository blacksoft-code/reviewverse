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

import { ReviewReactionsService } from './review-reactions.service';
import { ReactToReviewDto } from './dto/react-to-review.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Review Reactions')
@Controller('reviews/:reviewId/reactions')
export class ReviewReactionsController {
  constructor(
    private readonly reactionsService: ReviewReactionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'React to a review (Helpful/Love/Accurate/Haha/Dislike) — নতুন react বা আগের react বদলানো, দুটোই এখান থেকে',
  })
  react(
    @Param('reviewId') reviewId: string,
    @Body() dto: ReactToReviewDto,
    @Req() req: any,
  ) {
    return this.reactionsService.react(
      reviewId,
      req.user.userId,
      dto.type,
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove your reaction' })
  unreact(
    @Param('reviewId') reviewId: string,
    @Req() req: any,
  ) {
    return this.reactionsService.unreact(
      reviewId,
      req.user.userId,
    );
  }

  @Get('summary')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Get reaction counts per type (+ your own reaction if logged in)',
  })
  getSummary(
    @Param('reviewId') reviewId: string,
    @Req() req: any,
  ) {
    return this.reactionsService.getSummary(
      reviewId,
      req.user?.userId,
    );
  }
}