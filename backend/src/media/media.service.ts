import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { MediaType, Media } from '@prisma/client';


const UPLOAD_ROOT = path.join(
  process.cwd(),
  'uploads',
);

// MediaType অনুযায়ী কোন সাবফোল্ডারে সেভ হবে
const FOLDER_MAP: Record<MediaType, string> = {
  USER_PROFILE: 'users',
  USER_COVER: 'users',
  ENTITY_LOGO: 'entities',
  ENTITY_COVER: 'entities',
  REVIEW: 'reviews',
  ENTITY_POST: 'entity-posts',
  OFFERING: 'offerings',
};

// এই টাইপগুলো "singular" — মানে একজন user/entity/offering-এর একটাই
// active profile/cover/logo/offering photo থাকবে, নতুনটা এলে পুরনোটা মুছে যাবে।
// REVIEW আর ENTITY_POST-এ এটা প্রযোজ্য না (multiple photo চলবে)
const SINGULAR_TYPES: MediaType[] = [
  'USER_PROFILE',
  'USER_COVER',
  'ENTITY_LOGO',
  'ENTITY_COVER',
  'OFFERING',
];

// Photos tab-এ দেখানো একটা ছবি
export type PhotoSource =
  | 'PROFILE'
  | 'COVER'
  | 'LOGO'
  | 'REVIEW'
  | 'POST';

export type PhotoItem = {
  id: string;
  url: string;
  source: PhotoSource;
  createdAt: Date;
  // ছবিটা কোথা থেকে এসেছে (যেমন "Review at Biomed") — থাকলে দেখানো হয়
  label?: string;
  href?: string;
};

const SOURCE_BY_TYPE: Partial<Record<MediaType, PhotoSource>> = {
  USER_PROFILE: 'PROFILE',
  USER_COVER: 'COVER',
  ENTITY_LOGO: 'LOGO',
  ENTITY_COVER: 'COVER',
  REVIEW: 'REVIEW',
  ENTITY_POST: 'POST',
};

export type MediaRefs = {
  userId?: string;
  entityId?: string;
  reviewId?: string;
  entityPostId?: string;
  offeringId?: string;
};

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  // ── compression logic — অপরিবর্তিত ──
  async processImage(buffer: Buffer) {
    let quality = 80;
    let width = 1600;

    let output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    while (
      output.length > 100 * 1024 &&
      quality > 40
    ) {
      quality -= 5;

      output = await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }

    while (
      output.length > 100 * 1024 &&
      width > 800
    ) {
      width -= 100;

      output = await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }

    return {
      buffer: output,
      size: output.length,
      mimeType: 'image/webp',
    };
  }

  // ── compress → disk-এ সেভ → Media row তৈরি (direct FK দিয়ে) ──
 async saveMedia(
  buffer: Buffer,
  type: MediaType,
  refs: MediaRefs,
) {
  const { buffer: compressed } =
    await this.processImage(buffer);

  const folder = FOLDER_MAP[type];
  const folderPath = path.join(UPLOAD_ROOT, folder);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filename = `${randomUUID()}.webp`;
  fs.writeFileSync(
    path.join(folderPath, filename),
    compressed,
  );

  const baseUrl =
  process.env.BACKEND_URL ?? 'http://localhost:3000';

const url = `${baseUrl}/uploads/${folder}/${filename}`;

  // NEW: profile/cover/logo-এর মতো singular টাইপ হলে,
  // আগের ছবি (থাকলে) ডিস্ক + DB থেকে মুছে ফেলা হচ্ছে —
  // নাহলে একাধিক row জমে গিয়ে সবসময় সবচেয়ে পুরনোটাই দেখা যায়
  if (SINGULAR_TYPES.includes(type)) {
    const existing = await this.prisma.media.findFirst({
      where: {
        type,
        ...(refs.userId && { userId: refs.userId }),
        ...(refs.entityId && {
          entityId: refs.entityId,
        }),
        ...(refs.offeringId && {
          offeringId: refs.offeringId,
        }),
      },
    });

    if (existing) {
      await this.deleteMedia(existing.id);
    }
  }

  return this.prisma.media.create({
    data: {
      url,
      type,
      userId: refs.userId,
      entityId: refs.entityId,
      reviewId: refs.reviewId,
      entityPostId: refs.entityPostId,
      offeringId: refs.offeringId,
    },
  });
}

  async saveMultiple(
    files: Express.Multer.File[],
    type: MediaType,
    refs: MediaRefs,
  ) {
    const results: Media[] = [];

    for (const file of files) {
      const media = await this.saveMedia(
        file.buffer,
        type,
        refs,
      );
      results.push(media);
    }

    return results;
  }

  // ─────────────────────────────
  // USER PHOTOS (public — সবাই দেখতে পাবে)
  // user-এর profile photo + cover photo + তার সব review-এর ছবি,
  // সবচেয়ে নতুন আগে। (OFFERING/POST-এর ছবি এখানে আসে না)
  // ─────────────────────────────
  async getUserPhotos(userId: string): Promise<PhotoItem[]> {
    const rows = await this.prisma.media.findMany({
      where: {
        OR: [
          {
            userId,
            type: { in: ['USER_PROFILE', 'USER_COVER'] },
          },
          {
            type: 'REVIEW',
            review: { userId },
          },
        ],
      },
      select: {
        id: true,
        url: true,
        type: true,
        createdAt: true,
        review: {
          select: {
            id: true,
            entity: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.flatMap((m) => {
      const source = SOURCE_BY_TYPE[m.type];
      if (!source) return [];

      const item: PhotoItem = {
        id: m.id,
        url: m.url,
        source,
        createdAt: m.createdAt,
      };

      if (m.type === 'REVIEW' && m.review) {
        item.label = `Review at ${m.review.entity.name}`;
        item.href = `/entities/${m.review.entity.slug}/reviews?reviewId=${m.review.id}`;
      }

      return [item];
    });
  }

  // ─────────────────────────────
  // ENTITY PHOTOS (public)
  // entity-র post-এর সব ছবি + logo (profile) + cover, নতুন আগে।
  // REVIEW আর OFFERING-এর ছবি ইচ্ছে করেই বাদ।
  // ─────────────────────────────
  async getEntityPhotos(entityId: string): Promise<PhotoItem[]> {
    const [rows, entity] = await Promise.all([
      this.prisma.media.findMany({
        where: {
          OR: [
            {
              entityId,
              type: { in: ['ENTITY_LOGO', 'ENTITY_COVER'] },
            },
            {
              type: 'ENTITY_POST',
              entityPost: { entityId },
            },
          ],
        },
        select: {
          id: true,
          url: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entity.findUnique({
        where: { id: entityId },
        select: {
          logo: true,
          coverPhoto: true,
          updatedAt: true,
        },
      }),
    ]);

    const items: PhotoItem[] = rows.flatMap((m) => {
      const source = SOURCE_BY_TYPE[m.type];
      return source
        ? [{ id: m.id, url: m.url, source, createdAt: m.createdAt }]
        : [];
    });

    // পুরনো business-এ logo/cover শুধু Entity-র field-এ থাকতে পারে (Media row
    // ছাড়া) — সেগুলোও যেন বাদ না পড়ে
    const known = new Set(items.map((i) => i.url));

    if (entity?.logo && !known.has(entity.logo)) {
      items.push({
        id: `logo-${entityId}`,
        url: entity.logo,
        source: 'LOGO',
        createdAt: entity.updatedAt,
      });
    }

    if (entity?.coverPhoto && !known.has(entity.coverPhoto)) {
      items.push({
        id: `cover-${entityId}`,
        url: entity.coverPhoto,
        source: 'COVER',
        createdAt: entity.updatedAt,
      });
    }

    return items.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findByRef(refs: MediaRefs) {
    return this.prisma.media.findMany({
      where: {
        ...(refs.userId && { userId: refs.userId }),
        ...(refs.entityId && {
          entityId: refs.entityId,
        }),
        ...(refs.reviewId && {
          reviewId: refs.reviewId,
        }),
        ...(refs.entityPostId && {
          entityPostId: refs.entityPostId,
        }),
        ...(refs.offeringId && {
          offeringId: refs.offeringId,
        }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteMedia(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (media) {
      const filePath = path.join(
        process.cwd(),
        media.url.replace(/^\//, ''),
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return this.prisma.media.delete({
      where: { id: mediaId },
    });
  }
}