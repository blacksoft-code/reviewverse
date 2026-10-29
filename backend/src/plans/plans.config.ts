import { PlanTier } from '@prisma/client';

// Plan-এর সব তথ্য এক জায়গায়। দাম বা limit বদলাতে শুধু এই file বদলালেই হবে।

export type PlanConfig = {
  tier: PlanTier;
  name: string;
  // টাকায় (BDT)
  monthlyPrice: number;
  yearlyPrice: number;
  // কতগুলো offering public (সবার জন্য খোলা) থাকবে
  publicOfferingLimit: number;
  // মোট কতগুলো offering বানানো যাবে (সীমার উপরেরগুলো locked হয়ে তৈরি হয়)
  totalOfferingLimit: number;
  // Blue badge পাওয়ার যোগ্য কিনা (Verified-ও লাগে; paid plan = true)
  blueBadgeEligible: boolean;
};

export const PLANS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    publicOfferingLimit: 5,
    totalOfferingLimit: 100,
    blueBadgeEligible: false,
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    monthlyPrice: 200,
    yearlyPrice: 2000,
    publicOfferingLimit: 20,
    totalOfferingLimit: 100,
    blueBadgeEligible: true,
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth',
    monthlyPrice: 500,
    yearlyPrice: 5000,
    publicOfferingLimit: 100,
    totalOfferingLimit: 100,
    blueBadgeEligible: true,
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    publicOfferingLimit: 1000,
    totalOfferingLimit: 1000,
    blueBadgeEligible: true,
  },
};

// Plan-এর মেয়াদ শেষের পর এত দিন সুবিধা (limit, badge) থেকে যায়
export const GRACE_DAYS = 3;
