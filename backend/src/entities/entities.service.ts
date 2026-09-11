import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';

import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
  ) {}

async create(
  createEntityDto: CreateEntityDto,
  userId: string,
) {
  // Duplicate check: same name + same category + same location
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
    // NEW: Entity + (Owner flow হলে) EntityMembership — দুটো
    // একটা transaction-এ, যাতে কোনো একটা ব্যর্থ হলে অন্যটাও রোলব্যাক হয়
    return await this.prisma.$transaction(async (tx) => {
      const entity = await tx.entity.create({
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

          businessHours: createEntityDto.businessHours,
          priceRange: createEntityDto.priceRange,
          serviceOptions: createEntityDto.serviceOptions,

          coverPhoto: createEntityDto.coverPhoto,
          logo: createEntityDto.logo,

          amenities: createEntityDto.amenities,
          paymentMethods: createEntityDto.paymentMethods,

          socialLinks: createEntityDto.socialLinks,
          menu: createEntityDto.menu,

          ownerName: createEntityDto.ownerName,
          ownerContact: createEntityDto.ownerContact,
          businessDocument: createEntityDto.businessDocument,
          businessRelationship:
            createEntityDto.businessRelationship,
        },
      });

      // NEW: শুধু "Owner flow"-তেই businessRelationship পাঠানো
      // হয় (Reviewer flow-তে হয় না) — এটাকেই সিগন্যাল হিসেবে
      // ব্যবহার করে membership তৈরি করা হচ্ছে
      if (createEntityDto.businessRelationship) {
        const roleMap: Record<
          string,
          'OWNER' | 'ADMIN' | 'EDITOR'
        > = {
          OWNER: 'OWNER',
          MANAGER: 'ADMIN',
          EMPLOYEE: 'EDITOR',
        };

        const role =
          roleMap[
            createEntityDto.businessRelationship
          ] ?? 'OWNER';

        await tx.entityMembership.create({
          data: {
            userId,
            entityId: entity.id,
            role,
          },
        });
      }

      return entity;
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

async findById(id: string) {
  const entity = await this.prisma.entity.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!entity) {
    throw new NotFoundException('Business not found.');
  }

  return entity;
}

// Owner/Manager/Employee (যেকোনো EntityMembership role) business info edit করতে পারবে
async update(
  id: string,
  userId: string,
  dto: UpdateEntityDto,
) {
  const entity = await this.prisma.entity.findUnique({
    where: { id },
  });

  if (!entity) {
    throw new NotFoundException('Business not found.');
  }

  const hasAccess = await this.entityMemberships.hasAccess(
    id,
    userId,
  );

  if (!hasAccess) {
    throw new ForbiddenException(
      'Only the business owner, manager, or employee can edit this business.',
    );
  }

  return this.prisma.entity.update({
    where: { id },
    data: dto,
  });
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
