import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { BusinessHourDto } from './business-hour.dto';

export class SetBusinessHoursDto {
  @ApiProperty({
    type: [BusinessHourDto],
    description:
      'সপ্তাহের যে কয়টা day সেট করতে চাও (সবগুলো দিতে হবে না — শুধু ' +
      'যেগুলো পাঠাও সেগুলোই আপডেট হবে, বাকি day-র আগের state অক্ষত থাকবে)। ' +
      'একই dayOfWeek দুইবার দেওয়া যাবে না।',
  })
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  @ArrayUnique((hour: BusinessHourDto) => hour.dayOfWeek, {
    message: 'Each day can only appear once.',
  })
  hours: BusinessHourDto[];
}