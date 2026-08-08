import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a review',
  })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid review data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
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
  @ApiOperation({
    summary: 'Get reviews for an entity',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  findByEntity(
    @Param('entityId') entityId: string,
  ) {
    return this.reviewsService.findByEntity(
      entityId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update your own review',
  })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only update your own review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      req.user.userId,
      id,
      updateReviewDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete your own review',
  })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only delete your own review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  delete(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.reviewsService.delete(
      req.user.userId,
      id,
    );
  }
}