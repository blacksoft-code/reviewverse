import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

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
}