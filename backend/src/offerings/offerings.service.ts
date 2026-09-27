import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';

@Injectable()
export class OfferingsService {
  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
  ) {}

  // ─────────────────────────────
  // PUBLIC — সবাই দেখতে পাবে (entity-র services/offerings ট্যাব)
  // ─────────────────────────────
  async findByEntity(entityId: string) {
    return this.prisma.offering.findMany({
      where: { entityId },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // ─────────────────────────────
  // PUBLIC — search box predictive suggestion-এর জন্য distinct
  // offering type (যেমন "Biriyani", "Burger") খুঁজে বের করে
  // ─────────────────────────────
  async searchTypes(query: string) {
    const offerings = await this.prisma.offering.findMany({
      where: {
        type: { contains: query, mode: 'insensitive' },
      },
      select: { type: true },
      distinct: ['type'],
      take: 10,
      orderBy: { type: 'asc' },
    });

    return offerings.map((o) => o.type);
  }
  
  // ─────────────────────────────
  // PUBLIC — location-aware offering-type search-এর জন্য (যেমন
  // "Best juice in Dhaka") — প্রতিটা matching offering-কে flatten করে,
  // entity-র সংক্ষিপ্ত তথ্য, rating, image, review count সহ রিটার্ন করে।
  // `entities.service.ts`-এর `findByLocation()` এই method-টাই কল করে।
  // ─────────────────────────────
  async searchByLocation(
    locationIds: string[],
    offeringType: string,
    options?: {
      categoryId?: string;
      sort?:
        | 'rating_desc'
        | 'rating_asc'
        | 'price_asc'
        | 'price_desc';
    },
  ) {
    const offerings = await this.prisma.offering.findMany({
      where: {
        type: {
          equals: offeringType,
          mode: 'insensitive',
        },
        entity: {
          locationId: { in: locationIds },
          ...(options?.categoryId && {
            categoryId: options.categoryId,
          }),
        },
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
        media: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        // শুধু count-এর জন্য id নেওয়া হচ্ছে — পুরো review row
        // লাগবে না, isLatest=true (বর্তমান review) গুলোই গোনা হচ্ছে
        reviews: {
          where: { isLatest: true },
          select: { id: true },
        },
      },
    });

    const results = offerings.map((offering) => ({
      id: offering.id,
      name: offering.name,
      type: offering.type,
      price: offering.price,
      averageRating: offering.averageRating,
      image: offering.media[0]?.url ?? null,
      reviewCount: offering.reviews.length,
      entity: offering.entity,
    }));

    const sort = options?.sort ?? 'rating_desc';

    results.sort((a, b) => {
      switch (sort) {
        case 'rating_asc':
          return a.averageRating - b.averageRating;
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating_desc':
        default:
          return b.averageRating - a.averageRating;
      }
    });

    return results;
  }

  // ─────────────────────────────
  // CREATE — owner/manager/employee যেকোনো membership role
  // ─────────────────────────────
  async create(
    entityId: string,
    userId: string,
    dto: CreateOfferingDto,
  ) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can add an offering.',
      );
    }

    return this.prisma.offering.create({
      data: {
        entityId,
        name: dto.name,
        type: dto.type,
        price: dto.price,
        description: dto.description,
      },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  async update(
    offeringId: string,
    userId: string,
    dto: UpdateOfferingDto,
  ) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
    });

    if (!offering) {
      throw new NotFoundException('Offering not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      offering.entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can edit this offering.',
      );
    }

    return this.prisma.offering.update({
      where: { id: offeringId },
      data: {
        name: dto.name,
        type: dto.type,
        price: dto.price,
        description: dto.description,
      },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  async remove(offeringId: string, userId: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
    });

    if (!offering) {
      throw new NotFoundException('Offering not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      offering.entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can delete this offering.',
      );
    }

    await this.prisma.offering.delete({
      where: { id: offeringId },
    });

    return { message: 'Offering deleted successfully' };
  }
}