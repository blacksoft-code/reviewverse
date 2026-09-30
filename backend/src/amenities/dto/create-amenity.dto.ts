import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAmenityDto {
  @ApiProperty({ example: 'Free WiFi' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}