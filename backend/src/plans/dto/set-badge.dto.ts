import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BadgeOverride } from '@prisma/client';

export class SetBadgeDto {
  @ApiProperty({
    enum: BadgeOverride,
    example: 'FORCE_ON',
    description:
      'AUTO = Verified + চালু paid plan থাকলে দেখাবে; FORCE_ON = Admin দিয়েছে (শর্ত ছাড়াই); FORCE_OFF = Admin বন্ধ করেছে',
  })
  @IsEnum(BadgeOverride)
  mode: BadgeOverride;
}
