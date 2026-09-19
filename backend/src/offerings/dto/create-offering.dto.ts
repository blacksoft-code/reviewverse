import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferingDto {
  @ApiProperty({
    example: 'Mutton Kacchi Biriyani',
    description: 'Offering name',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: 'Biriyani',
    description: 'Offering type/category',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty({ example: 330, description: 'Price' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: 'This is made with mutton and basmati rice.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
