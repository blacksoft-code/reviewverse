import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        createdAt: true,

        _count: {
          select: {
            reviews: true,
          },
        },

        reviews: {
          select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,

            entity: {
              select: {
                id: true,
                name: true,
                slug: true,
                location: true,

                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,

      reviewCount: user._count.reviews,

      reviews: user.reviews,
    };
  }
}