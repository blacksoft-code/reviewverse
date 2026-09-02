import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

   async create(
    createEntityDto: CreateEntityDto,
    userId: string,
  ) {
    // Duplicate check: same name + same category + same location
    // ভিন্ন category হলে একই name-এর business আলাদা হিসেবে allowed
    // (যেমন "Pizza Shuttle" restaurant আর "Pizza Shuttle" নামে salon)
    const existing = await this.prisma.entity.findFirst({
      where: {
        name: {
          equals: createEntityDto.name,
          mode: 'insensitive',
        },
        categoryId: createEntityDto.categoryId,
        ...(createEntityDto.location && {
          location: {
            equals: createEntityDto.location,
            mode: 'insensitive',
          },
        }),
      },
    });

    if (existing) {
      throw new ConflictException(
        `A business named "${existing.name}" already exists in this category and location.`,
      );
    }

    try {
      return await this.prisma.entity.create({
        data: {
          name: createEntityDto.name,
          slug: createEntityDto.slug,
          categoryId: createEntityDto.categoryId,

          createdById: userId,

          location: createEntityDto.location,
          phone: createEntityDto.phone,
          website: createEntityDto.website,
          email: createEntityDto.email,
          description: createEntityDto.description,

          // Owner business details
          businessHours: createEntityDto.businessHours,
          priceRange: createEntityDto.priceRange,
          serviceOptions: createEntityDto.serviceOptions,

          coverPhoto: createEntityDto.coverPhoto,
          logo: createEntityDto.logo,

          amenities: createEntityDto.amenities,
          paymentMethods: createEntityDto.paymentMethods,

          socialLinks: createEntityDto.socialLinks,
          menu: createEntityDto.menu,

          // Owner / Claim information
          ownerName: createEntityDto.ownerName,
          ownerContact: createEntityDto.ownerContact,
          businessDocument: createEntityDto.businessDocument,
          businessRelationship:
            createEntityDto.businessRelationship,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A business with this name already exists.',
        );
      }
      throw error;
    }
  }
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [entities, total] = await Promise.all([
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
      where: { slug },
      include: { category: true },
    });
  }

  async findOne(slug: string) {
    return this.prisma.entity.findUnique({
      where: { slug },
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
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { averageRating: 'desc' },
      include: { category: true },
    });
  }

  async getTopRated() {
    return this.prisma.entity.findMany({
      orderBy: { averageRating: 'desc' },
      take: 10,
      include: { category: true },
    });
  }
async getFollowers(entityId: string) {
  return this.prisma.entityFollow.findMany({
    where: {
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async getFollowersCount(entityId: string) {
  return this.prisma.entityFollow.count({
    where: {
      entityId,
    },
  });
}
  //last brc
}
