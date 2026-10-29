'use client';

import { useEffect, useState } from 'react';

import {
  BillingCycle,
  PlanConfig,
  PlanUsage,
  getPlanUsage,
  getPlans,
} from '@/services/plan.service';

import UsageBar from './UsageBar';

const card =
  'rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5';

function money(amount: number) {
  return `৳${amount.toLocaleString('en-US')}`;
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';
}

// Business Settings → "Plan & billing":
// বর্তমান plan, offering ব্যবহার আর চারটা plan-এর তুলনা।
// Plan কেনার বোতাম এখন বন্ধ — bKash/Nagad payment পরের ধাপে।
export default function PlanBillingSection({
  entityId,
}: {
  entityId: string;
}) {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlans(), getPlanUsage(entityId)])
      .then(([plansRes, usageRes]) => {
        setPlans(plansRes.data);
        setUsage(usageRes.data);

        // Dashboard-এর "Upgrade plan" link (#plan) থেকে এলে এখানে scroll
        if (window.location.hash === '#plan') {
          setTimeout(
            () =>
              document
                .getElementById('plan')
                ?.scrollIntoView({ behavior: 'smooth' }),
            100,
          );
        }
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load plan details',
        ),
      )
      .finally(() => setLoading(false));
  }, [entityId]);

  if (loading) {
    return (
      <section id="plan" className={`mt-8 ${card}`}>
        <p className="text-[15px] text-[#6e6e73]">
          Loading plan details…
        </p>
      </section>
    );
  }

  if (error || !usage) {
    return (
      <section id="plan" className={`mt-8 ${card}`}>
        <h2 className="text-[22px] font-semibold">Plan &amp; billing</h2>
        <p className="mt-2 text-sm text-[#d70015]">
          {error || 'Plan details are not available.'}
        </p>
      </section>
    );
  }

  const current = usage.plan;

  return (
    <section id="plan" className={`mt-8 ${card}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold">
            Plan &amp; billing
          </h2>
          <p className="mt-1 text-[15px] text-[#6e6e73]">
            Choose how many services customers can see and review.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            current.status === 'GRACE'
              ? 'bg-[#ff9f0a]/15 text-[#a15c00]'
              : current.status === 'ACTIVE'
                ? 'bg-[#34c759]/15 text-[#1d7a37]'
                : 'bg-[#f5f5f7] text-[#6e6e73]'
          }`}
        >
          {current.status === 'GRACE'
            ? 'Grace period'
            : current.status === 'ACTIVE'
              ? 'Active'
              : 'Free'}
        </span>
      </div>

      {/* ── Current plan ── */}
      <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-5">
        <p className="text-[13px] font-medium text-[#6e6e73]">
          Current plan
        </p>
        <p className="mt-1 text-[24px] font-semibold">
          {current.config.name}
          {current.billingCycle && (
            <span className="ml-2 text-sm font-normal text-[#6e6e73]">
              {current.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}
            </span>
          )}
        </p>

        {current.status === 'ACTIVE' && current.endsAt && (
          <p className="mt-1 text-sm text-[#6e6e73]">
            Active until {formatDate(current.endsAt)}.
          </p>
        )}

        {current.status === 'GRACE' && (
          <p className="mt-2 text-sm text-[#a15c00]">
            Your plan ended on {formatDate(current.endsAt)}. You have
            until {formatDate(current.graceEndsAt)} to renew — after
            that, services over the free limit will be locked.
          </p>
        )}

        <div className="mt-5 space-y-4">
          <UsageBar
            label="Public services (customers can see & review)"
            value={usage.publicCount}
            max={usage.publicLimit}
          />
          <UsageBar
            label="Total services created"
            value={usage.totalCount}
            max={usage.totalLimit}
          />
        </div>

        {usage.lockedCount > 0 && (
          <p className="mt-4 text-sm text-[#a15c00]">
            🔒 {usage.lockedCount} locked{' '}
            {usage.lockedCount === 1 ? 'service is' : 'services are'}{' '}
            hidden from customers. Upgrade to unlock more.
          </p>
        )}
      </div>

      {/* ── Cycle toggle ── */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <h3 className="text-[17px] font-semibold">All plans</h3>

        <div className="inline-flex rounded-full bg-[#e8e8ed] p-1 text-sm">
          {(['MONTHLY', 'YEARLY'] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                cycle === c
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73]'
              }`}
            >
              {c === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = plan.tier === current.tier;
          const price =
            cycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
          const saving = plan.monthlyPrice * 12 - plan.yearlyPrice;

          return (
            <div
              key={plan.tier}
              className={`rounded-2xl p-5 ring-1 ${
                isCurrent
                  ? 'bg-[#0071e3]/5 ring-[#0071e3]'
                  : 'bg-white ring-black/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[17px] font-semibold">
                  {plan.name}
                </p>

                {isCurrent && (
                  <span className="rounded-full bg-[#0071e3] px-2.5 py-0.5 text-xs font-semibold text-white">
                    Current
                  </span>
                )}
              </div>

              <p className="mt-2">
                <span className="text-[28px] font-semibold tracking-tight">
                  {price === 0 ? 'Free' : money(price)}
                </span>
                {price > 0 && (
                  <span className="ml-1 text-sm text-[#6e6e73]">
                    / {cycle === 'MONTHLY' ? 'month' : 'year'}
                  </span>
                )}
              </p>

              {cycle === 'YEARLY' && saving > 0 && (
                <p className="text-xs font-medium text-[#1d7a37]">
                  Save {money(saving)} a year
                </p>
              )}

              <ul className="mt-4 space-y-1.5 text-sm text-[#424245]">
                <li>
                  ✓ {plan.publicOfferingLimit.toLocaleString('en-US')}{' '}
                  public services
                </li>
                <li>
                  ✓ Up to {plan.totalOfferingLimit.toLocaleString('en-US')}{' '}
                  services in total
                </li>
                <li>
                  {plan.blueBadgeEligible
                    ? '✓ Blue badge (after verification)'
                    : '– No blue badge'}
                </li>
              </ul>

              <button
                type="button"
                disabled
                title="Payments are coming soon"
                className="mt-5 w-full cursor-not-allowed rounded-full bg-[#e8e8ed] px-4 py-2.5 text-sm font-medium text-[#86868b]"
              >
                {isCurrent ? 'Your current plan' : 'Coming soon'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-5 rounded-2xl bg-[#f5f5f7] p-4 text-xs text-[#6e6e73]">
        Paying for a plan with bKash and Nagad is coming soon. The blue
        badge shows on your public profile when your business is
        verified and has an active paid plan.
      </p>
    </section>
  );
}
