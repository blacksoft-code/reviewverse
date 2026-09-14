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

export class CreateCommentDto {
  @ApiProperty({
    example: 'Totally agree with this review!',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description:
      'দিলে এটা reply হবে (parent comment-এর id), না দিলে top-level comment',
    example: '9d0e2f5a-...-comment-id',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}