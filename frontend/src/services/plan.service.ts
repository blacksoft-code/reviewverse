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

export type BadgeMode = 'AUTO' | 'FORCE_ON' | 'FORCE_OFF';

// Blue badge-এর অবস্থা। missing = AUTO মোডে কী কী বাকি
export type BadgeState = {
  show: boolean;
  mode: BadgeMode;
  isVerified: boolean;
  missing: ('VERIFICATION' | 'PAID_PLAN')[];
};

export type PlanUsage = {
  badge: BadgeState;
  isVerified: boolean;
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

// ───────── Admin ─────────

export type AdminEntityRow = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
  isVerified: boolean;
  verifiedUntil: string | null;
  plan: {
    tier: PlanTier;
    name: string;
    status: PlanStatus;
    billingCycle: BillingCycle | null;
    endsAt: string | null;
    graceEndsAt: string | null;
  };
  badge: BadgeState;
};

export async function getAdminEntities(q?: string) {
  return apiFetch<ApiEnvelope<AdminEntityRow[]>>(
    `/plans/admin/entities${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  );
}

export async function adminSetPlan(
  entityId: string,
  plan: PlanTier,
  billingCycle: BillingCycle,
) {
  return apiFetch<ApiEnvelope<PlanUsage>>(
    `/plans/admin/entity/${entityId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ plan, billingCycle }),
    },
  );
}

export async function adminSetBadge(
  entityId: string,
  mode: BadgeMode,
) {
  return apiFetch<ApiEnvelope<BadgeState>>(
    `/plans/admin/entity/${entityId}/badge`,
    {
      method: 'PATCH',
      body: JSON.stringify({ mode }),
    },
  );
}
