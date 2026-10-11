import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareCommentDto {
  @ApiProperty({ example: 'Totally agree!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description: 'দিলে এটা reply হবে (parent comment-এর id)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
