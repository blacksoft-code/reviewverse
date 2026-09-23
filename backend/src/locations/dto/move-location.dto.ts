import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveLocationDto {
  @ApiPropertyOptional({
    description:
      'New parents id। Location-কে root/country level-এ আনতে চাইলে খালি রাখো বা null দাও।',
  })
  @IsOptional()
  @IsString()
  newParentId?: string | null;
}
