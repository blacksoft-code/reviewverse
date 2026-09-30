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
import { LocationsService } from '../locations/locations.service';
import { OfferingsService } from '../offerings/offerings.service';

@Injectable()
export class EntitiesService {
  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
    private locationsService: LocationsService,
    private offeringsService: OfferingsService,
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
      subCategoryId: createEntityDto.subCategoryId,
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
          locationId: createEntityDto.locationId,
          phone: createEntityDto.phone,
          website: createEntityDto.website,
          email: createEntityDto.email,
          description: createEntityDto.description,

          businessHours: createEntityDto.businessHours,
          priceRange: createEntityDto.priceRange,
          serviceOptions: createEntityDto.serviceOptions,

          coverPhoto: createEntityDto.coverPhoto,
          logo: createEntityDto.logo,

          amenities: {
            connect: (createEntityDto.amenityIds ?? []).map(
              (id) => ({ id }),
            ),
          },
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
    include: { 
      category: true,
      amenities: true,
      media: {
        where: { type: { in: ['ENTITY_LOGO', 'ENTITY_COVER'] } },
      },
     },
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

  // amenityIds আলাদা করে নিচ্ছি কারণ এটা সরাসরি Prisma scalar field
  // না — relation হিসেবে "set" দিয়ে হ্যান্ডেল করতে হবে। বাকি সব
  // ফিল্ড আগের মতোই সরাসরি dto থেকে যাচ্ছে।
  const { amenityIds, ...rest } = dto;

  return this.prisma.entity.update({
    where: { id },
    data: {
      ...rest,
      // amenityIds পাঠানো হলে তবেই amenities বদলাবে — undefined
      // থাকলে (ফর্মের এই অংশ touch না করলে) পুরনো amenities
      // অক্ষত থাকবে।
      ...(amenityIds !== undefined && {
        amenities: {
          set: amenityIds.map((amenityId) => ({
            id: amenityId,
          })),
        },
      }),
    },
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
          amenities: true,
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
      include: { category: true, amenities: true },
    });
  }

  async findOne(slug: string) {
    return this.prisma.entity.findFirst({
      where: { 
        OR: [{ slug }, { id: slug }], 
      },
      include: {
        category: true,
        amenities: true,
        media: {
          where: { type: { in: ['ENTITY_LOGO', 'ENTITY_COVER'] } },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            media: { 
              orderBy: {
                createdAt: 'asc',
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

  // Phase 3+4 — Location-scoped listing + ranking
  async findByLocation(
    locationId: string,
    options?: {
      categoryId?: string;
      offeringType?: string;
      sort?:
        | 'rating_desc'
        | 'rating_asc'
        | 'price_asc'
        | 'price_desc';
    },
  ) {
    const locationIds =
      await this.locationsService.getDescendantIds(
        locationId,
      );

    const offeringFilter = options?.offeringType
      ? {
          equals: options.offeringType,
          mode: 'insensitive' as const,
        }
      : undefined;

    const sort = options?.sort ?? 'rating_desc';

    // ───────────────────────────────────────────────
    // Offering-type search (যেমন "Best juice in Dhaka") —
    // এখানে ফলাফল entity-ভিত্তিক না দিয়ে, প্রতিটা matching
    // offering-কে নিজের card হিসেবে (flatten করে) রিটার্ন
    // করা হচ্ছে। এই logic-টা OfferingsService-এ থাকে, কারণ
    // এটা offering-সম্পর্কিত query — Category-ভিত্তিক search
    // (নিচে) অপরিবর্তিত।
    // ───────────────────────────────────────────────
    if (offeringFilter && options?.offeringType) {
      return this.offeringsService.searchByLocation(
        locationIds,
        options.offeringType,
        {
          categoryId: options.categoryId,
          sort,
        },
      );
    }

    // ───────────────────────────────────────────────
    // Category-ভিত্তিক search (যেমন "Best hospital in Dhaka") —
    // আগের মতোই entity-ভিত্তিক card, কোনো পরিবর্তন নেই।
    // ───────────────────────────────────────────────
    const entities = await this.prisma.entity.findMany({
      where: {
        locationId: { in: locationIds },
        ...(options?.categoryId && {
          categoryId: options.categoryId,
        }),
      },
      include: {
        category: true,
      },
    });

    const ranked = entities.map((entity) => ({
      entity,
      minOfferingPrice: null as number | null,
    }));

    ranked.sort((a, b) => {
      switch (sort) {
        case 'rating_asc':
          return (
            a.entity.averageRating -
            b.entity.averageRating
          );
        case 'price_asc':
          return (
            (a.minOfferingPrice ?? Infinity) -
            (b.minOfferingPrice ?? Infinity)
          );
        case 'price_desc':
          return (
            (b.minOfferingPrice ?? -Infinity) -
            (a.minOfferingPrice ?? -Infinity)
          );
        case 'rating_desc':
        default:
          return (
            b.entity.averageRating -
            a.entity.averageRating
          );
      }
    });

    return ranked.map((r) => r.entity);
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

// [Admin] যেকোনো business-এর category/subcategory বদলানো —
// membership লাগে না, শুধু ADMIN role
async adminReassignCategory(
  id: string,
  categoryId: string,
  subCategoryId?: string | null,
) {
  const entity = await this.prisma.entity.findUnique({
    where: { id },
  });

  if (!entity) {
    throw new NotFoundException('Business not found.');
  }

  const category = await this.prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new NotFoundException('Category not found.');
  }

  if (subCategoryId) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      throw new NotFoundException(
        'Subcategory not found under this category.',
      );
    }
  }

  return this.prisma.entity.update({
    where: { id },
    data: {
      categoryId,
      subCategoryId: subCategoryId ?? null,
    },
  });
}
  //last brc
}