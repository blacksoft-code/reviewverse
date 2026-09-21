import {
  IsOptional,
  IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: 'Fast Food' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'fast-food' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Move this subcategory under a different category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}