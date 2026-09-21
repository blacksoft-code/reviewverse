import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'Fast Food' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'fast-food' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'dd157393-34c8-4eb5-9346-0dd7da9a78bb',
    description: 'Parent category ID',
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;
}