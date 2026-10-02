import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Credit Card' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}