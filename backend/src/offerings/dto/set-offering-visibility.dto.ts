import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetOfferingVisibilityDto {
  @ApiProperty({
    example: true,
    description: 'true = public (সবাই দেখবে), false = locked',
  })
  @IsBoolean()
  isPublic: boolean;
}
