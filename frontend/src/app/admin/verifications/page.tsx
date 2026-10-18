'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  AdminVerification,
  DOC_TYPE_LABELS,
  STATUS_LABELS,
  VerificationStatus,
  approveVerification,
  getAdminVerifications,
  openVerificationDocument,
  rejectVerification,
  revokeVerification,
  startVerificationReview,
} from '@/services/entity-verification.service';

const TABS: { key: VerificationStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'REVOKED', label: 'Revoked' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'ALL', label: 'All' },
];

const CHIP: Record<VerificationStatus, string> = {
  PENDING: 'bg-[#ff9f0a]/15 text-[#a15c00]',
  UNDER_REVIEW: 'bg-[#0071e3]/10 text-[#0071e3]',
  APPROVED: 'bg-[#34c759]/15 text-[#1d7a37]',
  REJECTED: 'bg-[#ff3b30]/10 text-[#d70015]',
  REVOKED: 'bg-[#ff3b30]/10 text-[#d70015]',
  EXPIRED: 'bg-[#ff9f0a]/15 text-[#a15c00]',
};

const btn =
  'rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50';
const btnGhost =
  'rounded-full bg-[#e8e8ed] px-4 py-2 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#dcdce1] disabled:opacity-50';
const btnDanger =
  'rounded-full bg-[#ff3b30]/10 px-4 py-2 text-sm font-medium text-[#d70015] transition hover:bg-[#ff3b30]/15 disabled:opacity-50';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<VerificationStatus | 'ALL'>('PENDING');
  const [items, setItems] = useState<AdminVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  // Reject / Revoke-এর কারণ লেখার জন্য inline form
  const [reasonFor, setReasonFor] = useState<{
    id: string;
    action: 'reject' | 'revoke';
  } | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAdminVerifications(
        tab === 'ALL' ? undefined : tab,
      );
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load',
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    load();
  }, [authLoading, user, router, load]);

  async function run(id: string, action: () => Promise<unknown>) {
    setActingOn(id);
    setError('');

    try {
      await action();
      setReasonFor(null);
      setReason('');
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action failed',
      );
    } finally {
      setActingOn(null);
    }
  }

  async function viewDocument(documentId: string) {
    try {
      await openVerificationDocument(documentId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not open document',
      );
    }
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
          Business verification
        </h1>
        <p className="mt-1 text-[17px] text-[#6e6e73]">
          Review documents and approve or reject verification requests.
        </p>

        {/* Filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                tab === t.key
                  ? 'bg-[#1d1d1f] font-medium text-white'
                  : 'bg-white text-[#424245] ring-1 ring-black/10 hover:bg-black/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-5 rounded-2xl bg-[#ff3b30]/10 p-4 text-sm text-[#d70015]">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-[15px] text-[#6e6e73]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center text-[15px] text-[#6e6e73] ring-1 ring-black/5">
            No applications here.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((v) => {
              const busy = actingOn === v.id;
              const asking = reasonFor?.id === v.id;

              return (
                <article
                  key={v.id}
                  className="rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/entities/${v.entity.slug}`}
                        target="_blank"
                        className="text-[19px] font-semibold hover:underline"
                      >
                        {v.entity.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-[#6e6e73]">
                        Applied by {v.applicant.name} ·{' '}
                        {v.applicant.email}
                      </p>
                      <p className="text-xs text-[#86868b]">
                        Submitted {formatDate(v.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${CHIP[v.status]}`}
                    >
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>

                  {v.applicantNote && (
                    <p className="mt-4 whitespace-pre-line rounded-2xl bg-[#f5f5f7] p-4 text-sm text-[#424245]">
                      “{v.applicantNote}”
                    </p>
                  )}

                  {/* Documents — private, শুধু এখানে Admin খুলতে পারে */}
                  <ul className="mt-4 space-y-2">
                    {v.documents.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-2.5 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {d.originalName}
                          </span>
                          <span className="text-xs text-[#86868b]">
                            {DOC_TYPE_LABELS[d.type]}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => viewDocument(d.id)}
                          className="shrink-0 text-sm text-[#0066cc] hover:underline"
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>

                  {(v.status === 'REJECTED' ||
                    v.status === 'REVOKED') &&
                    v.reviewNote && (
                      <p className="mt-4 text-sm text-[#d70015]">
                        Reason: {v.reviewNote}
                        {v.reviewer && ` — ${v.reviewer.name}`}
                      </p>
                    )}

                  {v.status === 'APPROVED' && (
                    <p className="mt-4 text-sm text-[#1d7a37]">
                      Approved {formatDate(v.approvedAt)} · valid until{' '}
                      {formatDate(v.expiresAt)}
                    </p>
                  )}

                  {/* Actions */}
                  {!asking && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {v.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(v.id, () =>
                              startVerificationReview(v.id),
                            )
                          }
                          className={btn}
                        >
                          Start review
                        </button>
                      )}

                      {(v.status === 'PENDING' ||
                        v.status === 'UNDER_REVIEW') && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(v.id, () => approveVerification(v.id))
                            }
                            className={btn}
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setReasonFor({
                                id: v.id,
                                action: 'reject',
                              })
                            }
                            className={btnDanger}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {v.status === 'APPROVED' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setReasonFor({
                              id: v.id,
                              action: 'revoke',
                            })
                          }
                          className={btnDanger}
                        >
                          Revoke badge
                        </button>
                      )}
                    </div>
                  )}

                  {asking && reasonFor && (
                    <div className="mt-5">
                      <label className="text-[13px] font-medium text-[#6e6e73]">
                        {reasonFor.action === 'reject'
                          ? 'Why is this rejected? (the business will see this)'
                          : 'Why is the badge revoked? (the business will see this)'}
                      </label>

                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="mt-1.5 w-full resize-none rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
                      />

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={busy || !reason.trim()}
                          onClick={() =>
                            run(v.id, () =>
                              reasonFor.action === 'reject'
                                ? rejectVerification(v.id, reason)
                                : revokeVerification(v.id, reason),
                            )
                          }
                          className={btnDanger}
                        >
                          {reasonFor.action === 'reject'
                            ? 'Confirm reject'
                            : 'Confirm revoke'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReasonFor(null);
                            setReason('');
                          }}
                          className={btnGhost}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
