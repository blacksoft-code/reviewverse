import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// multipart form-এ `files` আলাদা আসে; এখানে বাকি text field গুলো
export class ApplyVerificationDto {
  @ApiPropertyOptional({
    description:
      'প্রতিটা file-এর document type, JSON array (files-এর সাথে একই ক্রমে), যেমন ["NID","BUSINESS_REGISTRATION"]',
  })
  @IsString()
  types: string;

  @ApiPropertyOptional({ description: 'Admin-এর জন্য নোট (max 1000)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
