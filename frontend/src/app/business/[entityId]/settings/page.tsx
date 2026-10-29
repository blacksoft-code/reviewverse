'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';
import { getEntityById } from '@/services/entity-management.service';
import PlanBillingSection from '@/components/plans/PlanBillingSection';
import {
  DOC_TYPE_LABELS,
  STATUS_LABELS,
  VerificationApplication,
  VerificationDocType,
  VerificationState,
  VerificationStatus,
  applyForVerification,
  getVerificationState,
  withdrawVerification,
} from '@/services/entity-verification.service';

const MAX_DOCS = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

type DocRow = { type: VerificationDocType; file: File | null };

const card =
  'rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5';

const btn =
  'rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50';

const btnGhost =
  'rounded-full bg-[#e8e8ed] px-4 py-2 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#dcdce1] disabled:opacity-50';

const CHIP_STYLES: Record<VerificationStatus | 'NONE', string> = {
  NONE: 'bg-[#f5f5f7] text-[#6e6e73]',
  PENDING: 'bg-[#ff9f0a]/15 text-[#a15c00]',
  UNDER_REVIEW: 'bg-[#0071e3]/10 text-[#0071e3]',
  APPROVED: 'bg-[#34c759]/15 text-[#1d7a37]',
  REJECTED: 'bg-[#ff3b30]/10 text-[#d70015]',
  REVOKED: 'bg-[#ff3b30]/10 text-[#d70015]',
  EXPIRED: 'bg-[#ff9f0a]/15 text-[#a15c00]',
};

function StatusChip({
  status,
}: {
  status: VerificationStatus | 'NONE';
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${CHIP_STYLES[status]}`}
    >
      {status === 'NONE' ? 'Not verified' : STATUS_LABELS[status]}
    </span>
  );
}

// Submitted → Under review → Decision
function Steps({ status }: { status: VerificationStatus }) {
  const current =
    status === 'PENDING' ? 0 : status === 'UNDER_REVIEW' ? 1 : 2;

  const steps = ['Submitted', 'Under review', 'Decision'];

  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= current
                ? 'bg-[#0071e3] text-white'
                : 'bg-[#e8e8ed] text-[#86868b]'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span
            className={`text-sm ${
              i <= current ? 'font-medium' : 'text-[#86868b]'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <span
              className={`h-px flex-1 ${
                i < current ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
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

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentList({
  application,
}: {
  application: VerificationApplication;
}) {
  return (
    <ul className="mt-3 space-y-2">
      {application.documents.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-2.5 text-sm"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {d.originalName}
            </span>
            <span className="text-xs text-[#86868b]">
              {DOC_TYPE_LABELS[d.type]} · {formatSize(d.size)}
            </span>
          </span>
          <span className="text-xs text-[#86868b]">🔒 Private</span>
        </li>
      ))}
    </ul>
  );
}

export default function BusinessSettingsPage() {
  const router = useRouter();
  const { entityId } = useParams<{ entityId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { setActiveBusiness } = useBusinessContext();

  const [business, setBusiness] = useState<{
    name: string;
    logo: string | null;
  } | null>(null);
  const [state, setState] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState<DocRow[]>([
    { type: 'NID', file: null },
  ]);
  const [note, setNote] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [entityRes, stateRes] = await Promise.all([
        getEntityById(entityId),
        getVerificationState(entityId),
      ]);

      // Business settings = business mode — navbar/notification ঠিক business-এর থাকে
      setActiveBusiness({
        id: entityRes.data.id,
        name: entityRes.data.name,
        logo: entityRes.data.logo ?? null,
      });

      setBusiness({
        name: entityRes.data.name,
        logo: entityRes.data.logo ?? null,
      });
      setState(stateRes.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load this page',
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    load();
  }, [authLoading, user, load, router]);

  function updateRow(index: number, patch: Partial<DocRow>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function pickFile(index: number, file: File | null) {
    if (file) {
      if (!ALLOWED_MIME.includes(file.type)) {
        setError('Only PDF, JPG, PNG or WebP files are allowed.');
        return;
      }

      if (file.size > MAX_SIZE) {
        setError('Each file must be 10 MB or smaller.');
        return;
      }
    }

    setError('');
    updateRow(index, { file });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const documents = rows.filter(
      (r): r is { type: VerificationDocType; file: File } =>
        r.file !== null,
    );

    if (documents.length === 0) {
      setError('Please choose at least one document.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const next = await applyForVerification(
        entityId,
        documents,
        note,
      );

      setState(next);
      setShowForm(false);
      setRows([{ type: 'NID', file: null }]);
      setNote('');
      setAgreed(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(id: string) {
    if (!confirm('Withdraw this application?')) return;

    setWithdrawing(true);

    try {
      const res = await withdrawVerification(id);
      setState(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not withdraw',
      );
    } finally {
      setWithdrawing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="apple-ui flex min-h-screen items-center justify-center">
        <p className="text-[15px] text-[#6e6e73]">Loading settings…</p>
      </main>
    );
  }

  const latest = state?.applications[0];
  const active =
    latest &&
    (latest.status === 'PENDING' || latest.status === 'UNDER_REVIEW')
      ? latest
      : null;

  // সবশেষ সিদ্ধান্ত (rejected/revoked/expired) — কারণ দেখানোর জন্য
  const lastDecision =
    !active && !state?.isVerified && latest ? latest : null;

  const headline: VerificationStatus | 'NONE' = active
    ? active.status
    : state?.isVerified
      ? 'APPROVED'
      : (lastDecision?.status ?? 'NONE');

  return (
    <main className="apple-ui min-h-screen pb-20">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f5f7]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white text-sm font-semibold text-[#6e6e73] ring-1 ring-black/5">
            {business?.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              (business?.name ?? '?').charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {business?.name}
            </p>
            <p className="text-xs leading-tight text-[#6e6e73]">
              Business settings
            </p>
          </div>

          <Link
            href={`/business/${entityId}`}
            className={btnGhost}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-[17px] text-[#6e6e73]">
          Manage how {business?.name} appears on ReviewVerse.
        </p>

        {error && (
          <p className="mt-5 rounded-2xl bg-[#ff3b30]/10 p-4 text-sm text-[#d70015]">
            {error}
          </p>
        )}

        {/* ===================================================== */}
        {/* PLAN & BILLING */}
        {/* ===================================================== */}

        <PlanBillingSection entityId={entityId} />

        {/* ===================================================== */}
        {/* VERIFY THIS BUSINESS */}
        {/* ===================================================== */}

        {state && (
          <section className={`mt-8 ${card}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold">
                  Verify this business
                </h2>
                <p className="mt-1 text-[15px] text-[#6e6e73]">
                  Get a Verified badge so customers know{' '}
                  {business?.name} is the real thing.
                </p>
              </div>

              <StatusChip status={headline} />
            </div>

            {/* ── Verified ── */}
            {state.isVerified && (
              <div className="mt-6 rounded-2xl bg-[#34c759]/10 p-5">
                <p className="text-[17px] font-semibold text-[#1d7a37]">
                  ✓ {business?.name} is verified
                </p>
                <p className="mt-1 text-sm text-[#1d7a37]">
                  The Verified badge is showing on your public profile.
                  Valid until {formatDate(state.verifiedUntil)}.
                </p>

                {state.renewalDue && !active && (
                  <p className="mt-2 text-sm text-[#a15c00]">
                    Your verification expires soon. Renew it to keep
                    the badge.
                  </p>
                )}
              </div>
            )}

            {/* ── In progress ── */}
            {active && (
              <div className="mt-6">
                <Steps status={active.status} />

                <p className="mt-5 text-sm text-[#6e6e73]">
                  Submitted on {formatDate(active.createdAt)}.{' '}
                  {active.status === 'PENDING'
                    ? 'Our verification team will start reviewing it soon.'
                    : 'Our verification team is reviewing your documents.'}
                </p>

                <DocumentList application={active} />

                {active.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(active.id)}
                    disabled={withdrawing}
                    className={`mt-4 ${btnGhost}`}
                  >
                    {withdrawing ? 'Withdrawing…' : 'Withdraw application'}
                  </button>
                )}
              </div>
            )}

            {/* ── Last decision (rejected / revoked / expired) ── */}
            {lastDecision && (
              <div className="mt-6 rounded-2xl bg-[#ff3b30]/10 p-5">
                <p className="text-[17px] font-semibold text-[#d70015]">
                  {lastDecision.status === 'REJECTED' &&
                    'Your last application was rejected'}
                  {lastDecision.status === 'REVOKED' &&
                    'Your Verified badge was revoked'}
                  {lastDecision.status === 'EXPIRED' &&
                    'Your verification has expired'}
                </p>

                {lastDecision.reviewNote && (
                  <p className="mt-2 whitespace-pre-line text-sm text-[#d70015]">
                    Reason: {lastDecision.reviewNote}
                  </p>
                )}

                {lastDecision.status === 'EXPIRED' && (
                  <p className="mt-2 text-sm text-[#d70015]">
                    Apply again to get the badge back.
                  </p>
                )}
              </div>
            )}

            {/* ── Apply / Renew call to action ── */}
            {state.canApply && !showForm && (
              <div className="mt-6">
                {!state.isVerified && !lastDecision && (
                  <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-[#424245]">
                    <li>
                      An ID of the owner: NID or Passport
                    </li>
                    <li>
                      A business document: Business registration or
                      Trade license
                    </li>
                    <li>PDF, JPG, PNG or WebP — up to 10 MB each</li>
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className={btn}
                >
                  {state.isVerified
                    ? 'Renew verification'
                    : lastDecision
                      ? 'Apply again'
                      : 'Apply for verification'}
                </button>
              </div>
            )}

            {/* ── Application form ── */}
            {state.canApply && showForm && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <p className="text-[15px] font-semibold">Documents</p>
                  <p className="mt-0.5 text-xs text-[#86868b]">
                    Upload up to {MAX_DOCS} files — for example your
                    NID or Passport and your Business registration.
                  </p>

                  <div className="mt-3 space-y-3">
                    {rows.map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#f5f5f7] p-3"
                      >
                        <select
                          value={row.type}
                          onChange={(e) =>
                            updateRow(i, {
                              type: e.target
                                .value as VerificationDocType,
                            })
                          }
                          className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none focus:border-[#0071e3]"
                        >
                          {(
                            Object.keys(
                              DOC_TYPE_LABELS,
                            ) as VerificationDocType[]
                          ).map((t) => (
                            <option key={t} value={t}>
                              {DOC_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            pickFile(i, e.target.files?.[0] ?? null)
                          }
                          className="min-w-0 flex-1 text-sm"
                        />

                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setRows((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-sm text-[#d70015] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {rows.length < MAX_DOCS && (
                    <button
                      type="button"
                      onClick={() =>
                        setRows((prev) => [
                          ...prev,
                          { type: 'BUSINESS_REGISTRATION', file: null },
                        ])
                      }
                      className="mt-3 text-sm text-[#0066cc] hover:underline"
                    >
                      + Add another document
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#6e6e73]">
                    Note for the verification team (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-[#424245]">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm these documents are genuine and I am
                  authorized to represent this business.
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !agreed}
                    className={btn}
                  >
                    {submitting ? 'Uploading…' : 'Submit application'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className={btnGhost}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 rounded-2xl bg-[#f5f5f7] p-4 text-xs text-[#6e6e73]">
              🔒 Your documents are encrypted, stored privately and
              can only be opened by the ReviewVerse verification
              team. They are never shown on your profile.
            </p>

            {/* ── History ── */}
            {state.applications.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-semibold">
                  Application history
                </h3>

                <ul className="mt-3 divide-y divide-black/5">
                  {state.applications.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="text-[#424245]">
                        {formatDate(a.createdAt)} ·{' '}
                        {a.documents.length}{' '}
                        {a.documents.length === 1
                          ? 'document'
                          : 'documents'}
                      </span>
                      <StatusChip status={a.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
