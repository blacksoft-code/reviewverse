import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';

// ১২ অক্ষরের public ID (A-Z + 0-9) কি না
const PUBLIC_ID_PATTERN = /^[A-Za-z0-9]{12}$/;

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private blocksService: BlocksService,
  ) {}

  async search(query: string, viewerId?: string | null) {
    const searchQuery = query.trim();

    if (!searchQuery) {
      return {
        users: [],
        entities: [],
      };
    }

    const [hiddenUserIds, blockedEntityIds] =
      await Promise.all([
        this.blocksService.getHiddenUserIds(viewerId),
        this.blocksService.getBlockedEntityIds(viewerId),
      ]);

    const [users, entities] =
      await Promise.all([
        this.searchUsers(searchQuery, hiddenUserIds),
        this.searchEntities(searchQuery, blockedEntityIds),
      ]);

    return {
      users,
      entities,
    };
  }

  // =========================
  // USER SEARCH
  // =========================

  private async searchUsers(
    query: string,
    hiddenUserIds: string[] = [],
  ) {
    // Public ID দিয়ে search করলে ঠিক ঐ user-ই আসবে
    const isPublicId = PUBLIC_ID_PATTERN.test(query);

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: hiddenUserIds },
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          ...(isPublicId
            ? [{ publicId: query.toUpperCase() }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      take: 10,
    });

    const lowerQuery = query.toLowerCase();

    return users.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // 1. Exact match
      if (aName === lowerQuery && bName !== lowerQuery) {
        return -1;
      }

      if (bName === lowerQuery && aName !== lowerQuery) {
        return 1;
      }

      // 2. Prefix match
      const aStartsWith = aName.startsWith(lowerQuery);
      const bStartsWith = bName.startsWith(lowerQuery);

      if (aStartsWith && !bStartsWith) {
        return -1;
      }

      if (bStartsWith && !aStartsWith) {
        return 1;
      }

      // 3. Alphabetical
      return aName.localeCompare(bName);
    });
  }

  // =========================
  // ENTITY SEARCH
  // =========================

  private async searchEntities(
    query: string,
    blockedEntityIds: string[] = [],
  ) {
    // Public ID দিয়ে search করলে ঠিক ঐ business-ই আসবে
    const isPublicId = PUBLIC_ID_PATTERN.test(query);

    const entities = await this.prisma.entity.findMany({
      where: {
        id: { notIn: blockedEntityIds },
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
          ...(isPublicId
            ? [{ publicId: query.toUpperCase() }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        averageRating: true,

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 10,
    });

    const lowerQuery = query.toLowerCase();

    return entities.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aSlug = a.slug.toLowerCase();
      const bSlug = b.slug.toLowerCase();

      // 1. Exact name match
      const aExact = aName === lowerQuery;
      const bExact = bName === lowerQuery;

      if (aExact && !bExact) {
        return -1;
      }

      if (bExact && !aExact) {
        return 1;
      }

      // 2. Name starts with query
      const aStartsWith = aName.startsWith(lowerQuery);
      const bStartsWith = bName.startsWith(lowerQuery);

      if (aStartsWith && !bStartsWith) {
        return -1;
      }

      if (bStartsWith && !aStartsWith) {
        return 1;
      }

      // 3. Slug starts with query
      const aSlugStartsWith =
        aSlug.startsWith(lowerQuery);

      const bSlugStartsWith =
        bSlug.startsWith(lowerQuery);

      if (
        aSlugStartsWith &&
        !bSlugStartsWith
      ) {
        return -1;
      }

      if (
        bSlugStartsWith &&
        !aSlugStartsWith
      ) {
        return 1;
      }

      // 4. Higher rating first
      return (
        b.averageRating -
        a.averageRating
      );
    });
  }
}