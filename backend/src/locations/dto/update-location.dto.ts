import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Mirpur 10' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    example: 'area',
    description: 'country, city, area, road, shop ইত্যাদি',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;
}