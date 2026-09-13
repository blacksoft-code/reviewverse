import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateEntityPostDto {
  @ApiProperty({
    example: 'We are now open every day until 11 PM! 🎉',
    description: 'Post content/caption',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  // ছবি এখানে না — post তৈরি হওয়ার পর post.id দিয়ে
  // POST /media/upload-multiple (type=ENTITY_POST) কল হবে
}