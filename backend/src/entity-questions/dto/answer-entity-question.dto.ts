import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerEntityQuestionDto {
  @ApiProperty({
    example: 'Yes, we deliver within 5 km.',
    description: 'Answer text (max 2000 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  answer: string;
}
