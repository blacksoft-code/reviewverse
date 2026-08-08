import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Restaurant',
    description: 'Category name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'restaurant',
    description: 'Unique URL-friendly category slug',
  })
  @IsNotEmpty()
  @IsString()
  slug: string;
}