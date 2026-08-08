import {
  IsInt,
  IsNotEmpty,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    example: 5,
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Great food and fast service',
    description: 'Review content',
  })
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: '918d3495-1aca-4c87-bfe0-d7b03d1f296c',
    description: 'ID of the entity being reviewed',
  })
  @IsNotEmpty()
  entityId: string;
}