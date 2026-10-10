import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.reactionsService.react(
      reviewId,
      req.user.userId,
      dto.type,
      actingEntityId,
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove your reaction' })
  unreact(
    @Param('reviewId') reviewId: string,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.reactionsService.unreact(
      reviewId,
      req.user.userId,
      actingEntityId,
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
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.reactionsService.getSummary(
      reviewId,
      req.user?.userId,
      actingEntityId,
    );
  }
}