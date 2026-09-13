import {
  IsOptional,
  IsString,
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
}