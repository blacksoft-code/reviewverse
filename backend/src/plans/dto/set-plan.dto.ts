import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, PlanTier } from '@prisma/client';

export class SetPlanDto {
  @ApiProperty({ enum: PlanTier, example: 'STARTER' })
  @IsEnum(PlanTier)
  plan: PlanTier;

  @ApiPropertyOptional({
    enum: BillingCycle,
    example: 'MONTHLY',
    description: 'FREE ছাড়া অন্য plan-এ দরকার (না দিলে MONTHLY)',
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}
