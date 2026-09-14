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
  @ApiPropertyOptional({ example: 'ReviewVerse Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  worksAt?: string;

  @ApiPropertyOptional({
    example: 'University of Dhaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  studiesAt?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  livesIn?: string;

  @ApiPropertyOptional({ example: 'Chittagong, Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  from?: string;

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