import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

// শুধু Google Maps-এর link গ্রহণযোগ্য (google.com/maps, maps.google.com,
// maps.app.goo.gl, goo.gl/maps)
export const GOOGLE_MAPS_URL_REGEX =
  /^https?:\/\/(?:(?:www\.|maps\.)?google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})\/maps|maps\.google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})(?:\/|\?|$)|maps\.app\.goo\.gl\/|goo\.gl\/maps(?:\/|\?|$))/i;

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

  @ApiPropertyOptional({
    example: 'c1d2e3f4-...',
    description: 'Structured Location node-এর id',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

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
    example: 'https://maps.app.goo.gl/AbCdEf123',
    description:
      'Google Maps link। খালি string ("") পাঠালে link মুছে যাবে',
  })
  // খালি/null হলে validation বাদ — যাতে link delete করা যায়
  @ValidateIf((o) => !!o.googleMapsUrl)
  @IsUrl({ require_protocol: true })
  @Matches(GOOGLE_MAPS_URL_REGEX, {
    message: 'googleMapsUrl must be a valid Google Maps link',
  })
  @MaxLength(500)
  googleMapsUrl?: string | null;

  @ApiPropertyOptional({
    example: 'contact@burgerking.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

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
@IsUrl({ require_tld: false })
coverPhoto?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
@IsUrl({ require_tld: false })
logo?: string;

   @ApiPropertyOptional({
    example: ['a1b2c3d4-amenity-1', 'a1b2c3d4-amenity-2'],
    description:
      'Master Amenity list থেকে বাছাই করা amenity id-গুলো',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];

  @ApiPropertyOptional({
    example: ['payment-method-id-1', 'payment-method-id-2'],
    description:
      'Master Payment Method list থেকে বাছাই করা id-গুলো',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethodIds?: string[];

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
@ApiPropertyOptional()
@IsOptional()
@IsString()
subCategoryId?: string;
}