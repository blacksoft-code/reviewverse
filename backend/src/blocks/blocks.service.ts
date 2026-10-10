import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Block সংক্রান্ত সব "কে কাকে দেখতে পাবে না" সিদ্ধান্ত এক জায়গায় —
// feed, search, comment, reaction সবাই এখান থেকে নেয়।
@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  // Facebook-এর মতো দুই দিকেই কাজ করে: viewer যাদের block করেছে
  // এবং যারা viewer-কে block করেছে — দুই দলই একে অপরের কাছে অদৃশ্য।
  async getHiddenUserIds(
    viewerId?: string | null,
  ): Promise<string[]> {
    if (!viewerId) return [];

    const rows = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: viewerId },
          { blockedId: viewerId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });

    return Array.from(
      new Set(
        rows.map((r) =>
          r.blockerId === viewerId
            ? r.blockedId
            : r.blockerId,
        ),
      ),
    );
  }

  // Entity block শুধু এক দিকের — user entity-কে block করে
  async getBlockedEntityIds(
    viewerId?: string | null,
  ): Promise<string[]> {
    if (!viewerId) return [];

    const rows = await this.prisma.entityBlock.findMany({
      where: { userId: viewerId },
      select: { entityId: true },
    });

    return rows.map((r) => r.entityId);
  }

  async getOverview(viewerId: string) {
    const [hiddenUserIds, blockedEntityIds] =
      await Promise.all([
        this.getHiddenUserIds(viewerId),
        this.getBlockedEntityIds(viewerId),
      ]);

    return { hiddenUserIds, blockedEntityIds };
  }
}
