import {
  IsEmail,
  MinLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john@gmail.com',
    description: 'Registered user email',
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