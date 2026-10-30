import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
  }
}