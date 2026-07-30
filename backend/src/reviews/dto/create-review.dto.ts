import {
  IsInt,
  IsNotEmpty,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  entityId: string;
}