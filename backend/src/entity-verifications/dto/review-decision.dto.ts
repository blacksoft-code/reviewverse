import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Reject / Revoke করার কারণ — business-কে দেখানো হয়
export class ReviewDecisionDto {
  @ApiProperty({ example: 'Document is unclear. Please upload again.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
