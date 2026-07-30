import {Body, Controller,Get, Param, Post, Req, UseGuards,} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: any,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      req.user.userId,
      createReviewDto,
    );
  }

  @Get('entity/:entityId')
    findByEntity(
    @Param('entityId') entityId: string,
    ) {
    return this.reviewsService.findByEntity(
        entityId,
    );
    }

}