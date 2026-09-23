import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────
  // CREATE (duplicate হলে existing-টাই ফেরত দেয়, নতুন তৈরি করে না)
  // ─────────────────────────────
  async create(dto: CreateLocationDto) {
    const parentId = dto.parentId ?? null;

    // একই parent-এর নিচে একই নামের location আগে থেকে আছে কিনা চেক
    const existing = await this.prisma.location.findFirst({
      where: {
        parentId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return existing;
    }

    let tier = 0;

    if (parentId) {
      const parent = await this.prisma.location.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          'Parent location not found.',
        );
      }

      tier = parent.tier + 1;
    }

    const location = await this.prisma.location.create({
      data: {
        name: dto.name,
        type: dto.type,
        parentId,
        tier,
      },
    });

    await this.addToClosure(location.id, parentId);

    return location;
  }

  // নতুন location-কে closure table-এ বসানো —
  // নিজের self-row (depth 0) + parent-এর সব ancestor থেকে depth+1 করে কপি
  private async addToClosure(
    locationId: string,
    parentId: string | null,
  ) {
    await this.prisma.locationClosure.create({
      data: {
        ancestorId: locationId,
        descendantId: locationId,
        depth: 0,
      },
    });

    if (!parentId) {
      return;
    }

    const parentAncestors =
      await this.prisma.locationClosure.findMany({
        where: { descendantId: parentId },
      });

    if (parentAncestors.length === 0) {
      return;
    }

    await this.prisma.locationClosure.createMany({
      data: parentAncestors.map((row) => ({
        ancestorId: row.ancestorId,
        descendantId: locationId,
        depth: row.depth + 1,
      })),
    });
  }

  // ─────────────────────────────
  // PREDICTIVE SEARCH — business add করার সময় user location টাইপ করলে
  // এটা existing location suggest করে (duplicate তৈরি এড়াতে)
  // ─────────────────────────────
  async search(query: string, parentId?: string) {
    return this.prisma.location.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        ...(parentId ? { parentId } : {}),
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 10,
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    return location;
  }

  // ─────────────────────────────
  // এই location আর তার সব descendant-এর id — search scope বানাতে ব্যবহার হবে
  // ─────────────────────────────
  async getDescendantIds(locationId: string) {
    const rows = await this.prisma.locationClosure.findMany({
      where: { ancestorId: locationId },
      select: { descendantId: true },
    });

    return rows.map((r) => r.descendantId);
  }

  // ─────────────────────────────
  // Breadcrumb path — root থেকে শুরু করে এই location পর্যন্ত
  // (যেমন: Bangladesh → Dhaka → Mirpur → Mirpur 1)
  // ─────────────────────────────
  async getPath(locationId: string) {
    const rows = await this.prisma.locationClosure.findMany({
      where: { descendantId: locationId },
      include: {
        ancestor: {
          select: { id: true, name: true, tier: true },
        },
      },
      orderBy: { depth: 'desc' },
    });

    return rows.map((r) => r.ancestor);
  }

  async getChildren(parentId: string | null) {
    return this.prisma.location.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });
  }

  // Phase 5 — Admin re-parent tooling
  // একটা location-কে (আর তার পুরো subtree-কে) অন্য parent-এর
  // নিচে সরানো — Closure Table-এর শুধু "বাইরের" ancestor link
  // rebuild হয়, subtree-র ভেতরের সম্পর্ক অপরিবর্তিত থাকে।
  async move(
    locationId: string,
    newParentId: string | null,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    if (newParentId === locationId) {
      throw new BadRequestException(
        'A location cannot be its own parent.',
      );
    }

    let newParent: { id: string; tier: number } | null =
      null;

    if (newParentId) {
      newParent = await this.prisma.location.findUnique({
        where: { id: newParentId },
        select: { id: true, tier: true },
      });

      if (!newParent) {
        throw new NotFoundException(
          'New parent location not found.',
        );
      }
    }

    // subtrees all member (নিজেসহ) — সাথে locationId থেকে তাদের distance
    const subtree = await this.prisma.locationClosure.findMany(
      {
        where: { ancestorId: locationId },
        select: { descendantId: true, depth: true },
      },
    );
    const subtreeIds = subtree.map((s) => s.descendantId);

    // নতুন parent যেন এই subtree-র ভেতরেরই কেউ না হয় (cycle আটকানো)
    if (
      newParentId &&
      subtreeIds.includes(newParentId)
    ) {
      throw new BadRequestException(
        'Cannot move a location under its own descendant.',
      );
    }

    // ১) subtree-র বাইরের পুরনো ancestor link মুছে ফেলা
    //    (subtree-র ভেতরের সম্পর্ক অক্ষত থাকছে)
    await this.prisma.locationClosure.deleteMany({
      where: {
        descendantId: { in: subtreeIds },
        ancestorId: { notIn: subtreeIds },
      },
    });

    // ২) নতুন parent-এর পুরো ancestor chain বের করা (নিজেসহ, depth 0)
    const newAncestors = newParentId
      ? await this.prisma.locationClosure.findMany({
          where: { descendantId: newParentId },
          select: { ancestorId: true, depth: true },
        })
      : [];

    // ৩) প্রতিটা subtree member-এর জন্য নতুন ancestor link বসানো
    const newRows = subtree.flatMap((member) =>
      newAncestors.map((anc) => ({
        ancestorId: anc.ancestorId,
        descendantId: member.descendantId,
        depth: anc.depth + 1 + member.depth,
      })),
    );

    if (newRows.length > 0) {
      await this.prisma.locationClosure.createMany({
        data: newRows,
      });
    }

    // ৪) parentId (শুধু root node-এর) + tier (পুরো subtree-র) আপডেট
    const newRootTier = newParent
      ? newParent.tier + 1
      : 0;

    await Promise.all(
      subtree.map((member) => {
        const isRoot = member.descendantId === locationId;

        return this.prisma.location.update({
          where: { id: member.descendantId },
          data: {
            tier: newRootTier + member.depth,
            ...(isRoot && { parentId: newParentId }),
          },
        });
      }),
    );

    return this.findOne(locationId);
  }
//last brac  
}
