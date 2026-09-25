import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    example: 'a1b2c3d4-1234-4c87-bfe0-d7b03d1f296c',
    description:
      'Optional — কোন specific item/offering নিয়ে এই review (না দিলে entity-level general review হিসেবে গণ্য হবে)',
  })
  @IsOptional()
  @IsUUID()
  offeringId?: string;
}