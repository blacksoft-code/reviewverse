import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    console.log('CREATE REVIEW CALLED');

    const review = await this.prisma.review.create({
      data: {
        rating: createReviewDto.rating,
        content: createReviewDto.content,
        userId,
        entityId: createReviewDto.entityId,
      },
    });

    console.log('REVIEW CREATED:', review);

    const reviews = await this.prisma.review.findMany({
      where: {
        entityId: createReviewDto.entityId,
      },
      select: {
        rating: true,
      },
    });

    console.log('REVIEWS FOUND:', reviews);

    const averageRating =
      reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      ) / reviews.length;

    console.log('AVERAGE =', averageRating);

    console.log(
      'UPDATING ENTITY:',
      createReviewDto.entityId,
    );

    const updatedEntity =
      await this.prisma.entity.update({
        where: {
          id: createReviewDto.entityId,
        },
        data: {
          averageRating,
        },
      });

    console.log(
      'ENTITY UPDATED:',
      updatedEntity,
    );

    return review;
  }

  async findByEntity(entityId: string) {
    return this.prisma.review.findMany({
      where: {
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async update(
      reviewId: string,
      updateReviewDto: UpdateReviewDto,
    ) {
      const review = await this.prisma.review.update({
        where: {
          id: reviewId,
        },
        data: updateReviewDto,
      });

      const reviews = await this.prisma.review.findMany({
        where: {
          entityId: review.entityId,
        },
        select: {
          rating: true,
        },
      });

      const averageRating =
        reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        ) / reviews.length;

      await this.prisma.entity.update({
        where: {
          id: review.entityId,
        },
        data: {
          averageRating,
        },
      });

      return review;
    }


//review delete feature
  async delete(reviewId: string) {
  // finding the review
  const review = await this.prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // review delete 
  await this.prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  // finding other review
  const reviews = await this.prisma.review.findMany({
    where: {
      entityId: review.entityId,
    },
    select: {
      rating: true,
    },
  });

  // average calculate 
  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        ) / reviews.length
      : 0;

  // entity update 
  await this.prisma.entity.update({
    where: {
      id: review.entityId,
    },
    data: {
      averageRating,
    },
  });

  return {
    message: 'Review deleted successfully',
  };
}

}