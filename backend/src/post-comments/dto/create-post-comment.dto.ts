import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreatePostCommentDto {
  @ApiProperty({
    example: 'Great update, congrats!',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description:
      'দিলে এটা reply হবে (parent comment-এর id), না দিলে top-level comment',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}