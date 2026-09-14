import {
  IsOptional,
  IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Restaurant',
    description: 'Category name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'restaurant',
    description: 'Unique URL-friendly category slug',
  })
  @IsOptional()
  @IsString()
  slug?: string;
}