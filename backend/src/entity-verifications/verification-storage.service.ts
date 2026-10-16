import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  scryptSync,
} from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

const KEY_PATTERN = /^[0-9a-f-]{36}\.bin$/;

// Verification document-এর private ও encrypted storage।
//  - file কখনো public static folder-এ যায় না; শুধু server disk-এ
//    (VERIFICATION_STORAGE_DIR, না থাকলে ./private-uploads/verification)
//  - AES-256-GCM দিয়ে encrypt করে রাখা হয় (iv + auth tag + ciphertext)
//  - key আসে VERIFICATION_ENCRYPTION_KEY (64 hex char) থেকে; না থাকলে
//    JWT_SECRET থেকে derive করা হয়
//  - পড়ার একমাত্র পথ: Admin-only endpoint
@Injectable()
export class VerificationStorageService {
  private readonly dir =
    process.env.VERIFICATION_STORAGE_DIR ||
    path.join(process.cwd(), 'private-uploads', 'verification');

  private getKey(): Buffer {
    const hex = process.env.VERIFICATION_ENCRYPTION_KEY;

    if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
      return Buffer.from(hex, 'hex');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException(
        'Document storage is not configured.',
      );
    }

    return scryptSync(secret, 'review-verse-verification-docs', 32);
  }

  async save(buffer: Buffer): Promise<string> {
    await fs.mkdir(this.dir, { recursive: true });

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();
    const storageKey = `${randomUUID()}.bin`;

    await fs.writeFile(
      path.join(this.dir, storageKey),
      Buffer.concat([iv, tag, encrypted]),
      { mode: 0o600 },
    );

    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    if (!KEY_PATTERN.test(storageKey)) {
      throw new NotFoundException('Document not found.');
    }

    let raw: Buffer;

    try {
      raw = await fs.readFile(path.join(this.dir, storageKey));
    } catch {
      throw new NotFoundException('Document file is missing.');
    }

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getKey(),
      iv,
    );
    decipher.setAuthTag(tag);

    try {
      return Buffer.concat([decipher.update(data), decipher.final()]);
    } catch {
      throw new InternalServerErrorException(
        'Document could not be decrypted.',
      );
    }
  }

  async remove(storageKey: string): Promise<void> {
    if (!KEY_PATTERN.test(storageKey)) return;

    try {
      await fs.unlink(path.join(this.dir, storageKey));
    } catch {
      // আগেই মুছে গেছে — সমস্যা নেই
    }
  }
}
