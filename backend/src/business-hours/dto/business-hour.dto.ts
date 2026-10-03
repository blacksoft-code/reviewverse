import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// "HH:mm", 24hr format — e.g. 09:00, 22:30
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class BusinessHourDto {
  @ApiProperty({
    example: 5,
    description: '0 = Sunday, 1 = Monday, ... 6 = Saturday',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: false,
    description:
      'true হলে এই day পুরো বন্ধ — তখন openTime/closeTime লাগবে না',
  })
  @IsBoolean()
  isClosed: boolean;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'isClosed false হলে required, "HH:mm" (24hr)',
  })
  @ValidateIf((dto) => !dto.isClosed)
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'openTime must be in HH:mm (24hr) format',
  })
  @IsOptional()
  openTime?: string;

  @ApiPropertyOptional({
    example: '22:00',
    description: 'isClosed false হলে required, "HH:mm" (24hr)',
  })
  @ValidateIf((dto) => !dto.isClosed)
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'closeTime must be in HH:mm (24hr) format',
  })
  @IsOptional()
  closeTime?: string;
}