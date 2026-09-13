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
};

// এই টাইপগুলো "singular" — মানে একজন user/entity-র একটাই
// active profile/cover/logo photo থাকবে, নতুনটা এলে পুরনোটা মুছে যাবে।
// REVIEW আর ENTITY_POST-এ এটা প্রযোজ্য না (multiple photo চলবে)
const SINGULAR_TYPES: MediaType[] = [
  'USER_PROFILE',
  'USER_COVER',
  'ENTITY_LOGO',
  'ENTITY_COVER',
];

export type MediaRefs = {
  userId?: string;
  entityId?: string;
  reviewId?: string;
  entityPostId?: string;
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