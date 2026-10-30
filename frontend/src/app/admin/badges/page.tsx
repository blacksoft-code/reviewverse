'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  AdminEntityRow,
  BadgeMode,
  BillingCycle,
  PlanTier,
  adminSetBadge,
  adminSetPlan,
  getAdminEntities,
} from '@/services/plan.service';

const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'PRO', label: 'Pro' },
];

const btn =
  'rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50';

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';
}

function BadgeReason({ row }: { row: AdminEntityRow }) {
  const { badge } = row;

  if (badge.mode === 'FORCE_ON') return <>Given by admin</>;
  if (badge.mode === 'FORCE_OFF') return <>Turned off by admin</>;
  if (badge.show) return <>Verified + active paid plan</>;

  return (
    <>
      Needs{' '}
      {badge.missing
        .map((m) => (m === 'VERIFICATION' ? 'verification' : 'a paid plan'))
        .join(' and ')}
    </>
  );
}

export default function AdminBadgesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<AdminEntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // প্রতিটা business-এর plan নির্বাচন (Apply চাপার আগ পর্যন্ত local)
  const [planDraft, setPlanDraft] = useState<
    Record<string, { plan: PlanTier; cycle: BillingCycle }>
  >({});

  const load = useCallback(async (q?: string) => {
    setLoading(true);

    try {
      const res = await getAdminEntities(q);
      setRows(res.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    load();
  }, [authLoading, user, router, load]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    load(query.trim() || undefined);
  }

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError('');

    try {
      await action();
      await load(query.trim() || undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action failed',
      );
    } finally {
      setBusyId(null);
    }
  }

  function draftFor(row: AdminEntityRow) {
    return (
      planDraft[row.id] ?? {
        plan: row.plan.tier,
        cycle: (row.plan.billingCycle ?? 'MONTHLY') as BillingCycle,
      }
    );
  }

  return (
    <main className="apple-ui min-h-screen pb-20">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/admin"
          className="text-sm text-[#0066cc] hover:underline"
        >
          ← Admin
        </Link>

        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight">
          Plans &amp; blue badge
        </h1>
        <p className="mt-1 text-[17px] text-[#6e6e73]">
          Set a business&apos;s plan by hand and give or turn off its
          blue badge.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a business…"
            className="min-w-0 flex-1 rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
          />
          <button type="submit" className={btn}>
            Search
          </button>
        </form>

        {error && (
          <p className="mt-5 rounded-2xl bg-[#ff3b30]/10 p-4 text-sm text-[#d70015]">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-[15px] text-[#6e6e73]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center text-[15px] text-[#6e6e73] ring-1 ring-black/5">
            No businesses found.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {rows.map((row) => {
              const busy = busyId === row.id;
              const draft = draftFor(row);

              return (
                <article
                  key={row.id}
                  className="rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/entities/${row.slug}`}
                        target="_blank"
                        className="text-[19px] font-semibold hover:underline"
                      >
                        {row.name}
                      </Link>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[#424245]">
                          Plan: {row.plan.name}
                          {row.plan.status === 'GRACE' && ' (grace)'}
                          {row.plan.endsAt &&
                            ` · until ${formatDate(row.plan.endsAt)}`}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 ${
                            row.isVerified
                              ? 'bg-[#34c759]/15 text-[#1d7a37]'
                              : 'bg-[#f5f5f7] text-[#6e6e73]'
                          }`}
                        >
                          {row.isVerified ? 'Verified ✓' : 'Not verified'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.badge.show
                            ? 'bg-[#0071e3]/10 text-[#0071e3]'
                            : 'bg-[#f5f5f7] text-[#6e6e73]'
                        }`}
                      >
                        {row.badge.show ? 'Badge showing' : 'Badge hidden'}
                      </span>
                      <p className="mt-1 text-xs text-[#86868b]">
                        <BadgeReason row={row} />
                      </p>
                    </div>
                  </div>

                  {/* Blue badge: Give / Turn off / Auto */}
                  <div className="mt-5">
                    <p className="text-[13px] font-medium text-[#6e6e73]">
                      Blue badge
                    </p>

                    <div className="mt-1.5 inline-flex rounded-full bg-[#e8e8ed] p-1 text-sm">
                      {(
                        [
                          ['AUTO', 'Auto'],
                          ['FORCE_ON', 'Give badge'],
                          ['FORCE_OFF', 'Turn off'],
                        ] as [BadgeMode, string][]
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={busy || row.badge.mode === mode}
                          onClick={() =>
                            run(row.id, () =>
                              adminSetBadge(row.id, mode),
                            )
                          }
                          className={`rounded-full px-4 py-1.5 font-medium transition disabled:cursor-default ${
                            row.badge.mode === mode
                              ? mode === 'FORCE_OFF'
                                ? 'bg-white text-[#d70015] shadow-sm'
                                : 'bg-white text-[#1d1d1f] shadow-sm'
                              : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <p className="mt-1.5 text-xs text-[#86868b]">
                      Auto: shows when the business is verified and has a
                      paid plan. Give badge works without either. Turn off
                      hides it even with a plan.
                    </p>
                  </div>

                  {/* Plan হাতে বসানো (payment আসা পর্যন্ত) */}
                  <div className="mt-5">
                    <p className="text-[13px] font-medium text-[#6e6e73]">
                      Set plan
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <select
                        value={draft.plan}
                        onChange={(e) =>
                          setPlanDraft((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...draft,
                              plan: e.target.value as PlanTier,
                            },
                          }))
                        }
                        className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none focus:border-[#0071e3]"
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      {draft.plan !== 'FREE' && (
                        <select
                          value={draft.cycle}
                          onChange={(e) =>
                            setPlanDraft((prev) => ({
                              ...prev,
                              [row.id]: {
                                ...draft,
                                cycle: e.target.value as BillingCycle,
                              },
                            }))
                          }
                          className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none focus:border-[#0071e3]"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(row.id, () =>
                            adminSetPlan(
                              row.id,
                              draft.plan,
                              draft.cycle,
                            ),
                          )
                        }
                        className={btn}
                      >
                        Apply
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-[#86868b]">
                      The plan starts now and runs for one month or one
                      year. Locked services unlock or lock to match the
                      new limit.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
