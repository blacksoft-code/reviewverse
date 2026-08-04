import { 
  Injectable,
  ForbiddenException,
  NotFoundException, 
} from '@nestjs/common';
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

//update method  

async update(
  userId: string,
  reviewId: string,
  updateReviewDto: UpdateReviewDto,
) {
  const existingReview =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!existingReview) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (existingReview.userId !== userId) {
    throw new ForbiddenException(
      'You can only update your own review',
    );
  }

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
async delete(
  userId: string,
  reviewId: string,
) {
  const review =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!review) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (review.userId !== userId) {
    throw new ForbiddenException(
      'You can only delete your own review',
    );
  }

  await this.prisma.review.delete({
    where: {
      id: reviewId,
    },
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
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        ) / reviews.length
      : 0;

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