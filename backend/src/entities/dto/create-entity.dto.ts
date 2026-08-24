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
}