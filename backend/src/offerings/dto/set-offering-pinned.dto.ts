import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetOfferingPinnedDto {
  @ApiProperty({
    example: true,
    description:
      'true = plan শেষ/কমলে এই offering আগে public থাকবে (সর্বোচ্চ ২০টা)',
  })
  @IsBoolean()
  isPinned: boolean;
}
