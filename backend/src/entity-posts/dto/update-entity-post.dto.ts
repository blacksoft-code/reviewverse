import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntityPostDto {
  @ApiPropertyOptional({
    example: 'Updated: open until midnight on weekends!',
    description: 'Updated post content/caption',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/promo-2.jpg',
    description: 'Updated image URL',
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}