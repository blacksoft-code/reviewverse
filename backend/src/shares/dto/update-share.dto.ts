import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShareDto {
  @ApiPropertyOptional({
    description: 'Share-এর caption (max 500 character)। খালি পাঠালে caption মুছে যায়',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
