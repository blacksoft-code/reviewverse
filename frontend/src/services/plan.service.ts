import { apiFetch } from '@/lib/api';

export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type PlanStatus = 'FREE' | 'ACTIVE' | 'GRACE';

// Backend-এর plans.config.ts-এর সাথে মেলে (সেখানেই দাম/limit বদলাতে হয়)
export type PlanConfig = {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  publicOfferingLimit: number;
  totalOfferingLimit: number;
  blueBadgeEligible: boolean;
};

export type EffectivePlan = {
  tier: PlanTier;
  status: PlanStatus;
  billingCycle: BillingCycle | null;
  endsAt: string | null;
  graceEndsAt: string | null;
  config: PlanConfig;
};

export type PlanUsage = {
  plan: EffectivePlan;
  totalCount: number;
  publicCount: number;
  lockedCount: number;
  publicLimit: number;
  totalLimit: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

// সব plan, দাম আর limit (public)
export async function getPlans() {
  return apiFetch<ApiEnvelope<PlanConfig[]>>('/plans');
}

// একটা business-এর বর্তমান plan আর offering ব্যবহার (owner/manager)
export async function getPlanUsage(entityId: string) {
  return apiFetch<ApiEnvelope<PlanUsage>>(
    `/plans/entity/${entityId}`,
  );
}
