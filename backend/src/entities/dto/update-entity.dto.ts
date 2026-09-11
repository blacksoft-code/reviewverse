import {
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntityDto {
  @ApiPropertyOptional({ example: 'Burger King' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'A popular fast-food restaurant.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Dhanmondi, Dhaka' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://burgerking.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: 'contact@burgerking.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'Mon-Fri: 10:00 AM - 10:00 PM',
  })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiPropertyOptional({ example: '$$' })
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
}