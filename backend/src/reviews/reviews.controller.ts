import {Body, Controller,Get, Patch, Param, Post, Req, UseGuards,} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateReviewDto } from './dto/update-review.dto';

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

   @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() updateReviewDto: UpdateReviewDto,
    ) {
      return this.reviewsService.update(
        id,
        updateReviewDto,
      );
    } 

}