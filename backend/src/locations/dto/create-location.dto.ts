import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'Mirpur 1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description:
      'Parent location-এর id। Country/root level হলে খালি রাখো।',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    example: 'area',
    description: 'country, city, area, road, shop ইত্যাদি (informational, optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;
}
