import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async search(query: string) {
    const searchQuery = query.trim();

    if (!searchQuery) {
      return {
        users: [],
        entities: [],
      };
    }

    const [users, entities] =
      await Promise.all([
        this.searchUsers(searchQuery),
        this.searchEntities(searchQuery),
      ]);

    return {
      users,
      entities,
    };
  }

  // =========================
  // USER SEARCH
  // =========================

  private async searchUsers(query: string) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        name: {
          contains: query,
          mode: 'insensitive',
        },
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

  private async searchEntities(query: string) {
    const entities = await this.prisma.entity.findMany({
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