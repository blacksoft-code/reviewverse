import {
  IsEmail,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'User full name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
  })
  @MinLength(6)
  password: string;
}