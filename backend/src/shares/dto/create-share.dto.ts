import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareDto {
  @ApiPropertyOptional({
    description: 'যে review share করা হচ্ছে (reviewId বা entityPostId — যেকোনো একটা)',
  })
  @IsOptional()
  @IsString()
  reviewId?: string;

  @ApiPropertyOptional({
    description: 'যে entity post share করা হচ্ছে',
  })
  @IsOptional()
  @IsString()
  entityPostId?: string;

  @ApiPropertyOptional({
    description: 'Share-এর সাথে নিজের কথা (max 500 character)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
