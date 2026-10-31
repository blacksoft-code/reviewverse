import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
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

  @ApiPropertyOptional({
    example: false,
    description:
      'true = নিয়ম না মেনে এখনই বসাও (Admin override)। না দিলে billing-এর নিয়ম: upgrade সাথে সাথে, downgrade/মাসিক→বার্ষিক মেয়াদ শেষে',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
