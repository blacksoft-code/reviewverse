import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UpdateUserInfoDto {
 @ApiPropertyOptional({
    example: 'a1b2c3d4-1234-4c87-bfe0-d7b03d1f296c',
    description:
      'Registered business (Entity) id — /entities/search দিয়ে predictive search করে বাছাই করা',
  })
  @IsOptional()
  @IsString()
  worksAtEntityId?: string;

  @ApiPropertyOptional({
    example: 'University of Dhaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  studiesAt?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-1234-4c87-bfe0-d7b03d1f296c',
    description:
      'Location tree থেকে বাছাই করা id (predictive search দিয়ে)',
  })
  @IsOptional()
  @IsString()
  livesInLocationId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-1234-4c87-bfe0-d7b03d1f296c',
    description:
      'Location tree থেকে বাছাই করা id (predictive search দিয়ে)',
  })
  @IsOptional()
  @IsString()
  fromLocationId?: string;

  @ApiPropertyOptional({
    example: '1998-05-14',
    description: 'ISO date string',
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({
    enum: Gender,
    example: 'MALE',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'Food lover, weekend traveler.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}