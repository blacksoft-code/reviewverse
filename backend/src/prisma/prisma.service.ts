import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';

// Public ID: ১২ অক্ষর, শুধু A-Z আর 0-9
const PUBLIC_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PUBLIC_ID_LENGTH = 12;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  // Verified থাকাটা private (শুধু Admin আর ঐ business জানবে)। তাই এই field গুলো
  // কোনো query-তে ডিফল্টে আসে না — public response-এ leak হয় না। যেখানে সত্যিই
  // দরকার (verification, plans) সেখানে `select`-এ নাম দিয়ে আনা হয়।
  constructor() {
    super({
      omit: {
        entity: {
          isVerified: true,
          verifiedAt: true,
          verifiedUntil: true,
          badgeOverride: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();

    // আগে থেকে থাকা user/business-এর public ID না থাকলে বসিয়ে দেয়
    try {
      await this.backfillPublicIds();
    } catch (error) {
      console.warn(
        'Public ID backfill skipped (migration চালানো হয়েছে তো?):',
        error instanceof Error ? error.message : error,
      );
    }
  }

  // ১২ অক্ষরের unique ID — অন্তত একটা letter ও একটা digit থাকবে,
  // আর User + Business মিলিয়ে কখনো এক হবে না
  async generatePublicId(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      let id = '';

      for (let i = 0; i < PUBLIC_ID_LENGTH; i++) {
        id += PUBLIC_ID_CHARS[randomInt(PUBLIC_ID_CHARS.length)];
      }

      if (!/[A-Z]/.test(id) || !/[0-9]/.test(id)) continue;

      const [user, entity] = await Promise.all([
        this.user.findUnique({
          where: { publicId: id },
          select: { id: true },
        }),
        this.entity.findUnique({
          where: { publicId: id },
          select: { id: true },
        }),
      ]);

      if (!user && !entity) return id;
    }

    throw new Error('Could not generate a unique public ID');
  }

  private async backfillPublicIds() {
    const users = await this.user.findMany({
      where: { publicId: null },
      select: { id: true },
    });

    for (const user of users) {
      await this.user.update({
        where: { id: user.id },
        data: { publicId: await this.generatePublicId() },
      });
    }

    const entities = await this.entity.findMany({
      where: { publicId: null },
      select: { id: true },
    });

    for (const entity of entities) {
      await this.entity.update({
        where: { id: entity.id },
        data: { publicId: await this.generatePublicId() },
      });
    }
  }
}