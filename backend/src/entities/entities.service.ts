import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createEntityDto: CreateEntityDto) {
    return this.prisma.entity.create({
      data: {
        name: createEntityDto.name,
        slug: createEntityDto.slug,
        categoryId: createEntityDto.categoryId,
      },
    });
  }

async findAll(
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [entities, total] =
    await Promise.all([
      this.prisma.entity.findMany({
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.entity.count(),
    ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: entities,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

    async findBySlug(slug: string) {
    return this.prisma.entity.findUnique({
        where: {
        slug,
        },
        include: {
        category: true,
        },
    });
    }

    async findOne(slug: string) {
      return this.prisma.entity.findUnique({
        where: {
          slug,
        },
        include: {
          category: true,
          reviews: {
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
          },
        },
      });
    }

    async search(query: string) {
  return this.prisma.entity.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },

    orderBy: {
      averageRating: 'desc',
    },

    // NEW:
    // Search result-এর সাথে category information-ও পাঠাচ্ছি।
    include: {
      category: true,
    },
  });
}

  async getTopRated() {
  return this.prisma.entity.findMany({
    orderBy: {
      averageRating: 'desc',
    },
    take: 10,
    include: {
      category: true,
    },
  });
}
}