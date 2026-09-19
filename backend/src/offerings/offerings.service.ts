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
      orderBy: { createdAt: 'desc' },
    });
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
