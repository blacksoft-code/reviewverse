import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';

export class ReactToPostDto {
  @ApiProperty({
    enum: ReactionType,
    example: 'HELPFUL',
  })
  @IsEnum(ReactionType)
  type: ReactionType;
}