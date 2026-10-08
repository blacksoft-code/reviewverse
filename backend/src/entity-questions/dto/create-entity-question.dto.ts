import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntityQuestionDto {
  @ApiProperty({
    example: 'Do you offer home delivery?',
    description: 'Question text (max 500 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}
