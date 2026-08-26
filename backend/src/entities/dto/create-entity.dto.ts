import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({
    example: 'Burger King',
    description: 'Business name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'burger-king',
    description: 'Unique URL-friendly slug',
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'dd157393-34c8-4eb5-9346-0dd7da9a78bb',
    description: 'ID of the category this business belongs to',
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  // NEW:
  // Reviewer flow-এর required basic information.
  @ApiProperty({
    example: 'Dhanmondi, Dhaka',
    description: 'Business location/address',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  // NEW:
  // এগুলো এখন optional।
  // পরে Owner flow-তে এগুলোর ব্যবহার আরও বাড়বে।
  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Business phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://burgerking.com',
    description: 'Business website',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: 'contact@burgerking.com',
    description: 'Business email',
  })
  @IsOptional()
  @IsString()
  email?: string;

  // NEW:
  // Business-এর description optional।
  @ApiPropertyOptional({
    example: 'A popular fast-food restaurant.',
    description: 'Business description',
  })
  @IsOptional()
  @IsString()
  description?: string;


// =========================
  // Owner business details
  // =========================

  @ApiPropertyOptional({
    example: 'Mon-Fri: 10:00 AM - 10:00 PM',
  })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiPropertyOptional({
    example: '$$',
  })
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiPropertyOptional({
    example: 'Dine-in, Takeaway, Delivery',
  })
  @IsOptional()
  @IsString()
  serviceOptions?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsUrl()
  coverPhoto?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({
    example: 'Wi-Fi, Parking, Wheelchair accessible',
  })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiPropertyOptional({
    example: 'Cash, Visa, Mastercard, bKash',
  })
  @IsOptional()
  @IsString()
  paymentMethods?: string;

  @ApiPropertyOptional({
    example: 'Facebook: https://facebook.com/example',
  })
  @IsOptional()
  @IsString()
  socialLinks?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/menu.pdf',
  })
  @IsOptional()
  @IsUrl()
  menu?: string;

  // =========================
  // Owner / Claim information
  // =========================

  @ApiPropertyOptional({
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({
    example: '+8801712345678',
  })
  @IsOptional()
  @IsString()
  ownerContact?: string;

  @ApiPropertyOptional({
    example: 'trade-license.pdf',
  })
  @IsOptional()
  @IsString()
  businessDocument?: string;

  @ApiPropertyOptional({
    example: 'OWNER',
  })
  @IsOptional()
  @IsString()
  businessRelationship?: string;
}