import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntityPostDto {
  @ApiProperty({
    example: 'We are now open every day until 11 PM! 🎉',
    description: 'Post content/caption',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/promo.jpg',
    description: 'Optional image URL attached to the post',
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}