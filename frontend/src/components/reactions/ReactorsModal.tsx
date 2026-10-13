'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import UserLink from '@/components/common/UserLink';
import { useAuth } from '@/context/AuthContext';
import type {
  Reactor,
  ReactionType,
} from '@/services/reaction.service';

import { REACTIONS, getReactionMeta } from './reaction-meta';

// "কে কে react করেছে" — সামনে modal, পেছনে blur-করা backdrop।
// Backdrop-এ click, ✕ বা Esc চাপলে বন্ধ হয়।
// Tab: All, তারপর যে reaction বেশি সেটা আগে (যেমন All · Helpful · Accurate)।
export default function ReactorsModal({
  onClose,
  fetchReactors,
}: {
  onClose: () => void;
  fetchReactors: () => Promise<{ data: Reactor[] }>;
}) {
  const { user } = useAuth();

  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'ALL' | ReactionType>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    fetchReactors()
      .then((res) => setReactors(res.data))
      .catch(() => setError('Could not load reactions.'))
      .finally(() => setLoading(false));

    // Esc দিয়ে বন্ধ + modal খোলা থাকলে পেছনের page scroll বন্ধ
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // যে reaction সবচেয়ে বেশি সেটা All-এর ঠিক পরে
  const tabs = useMemo(() => {
    const counts = new Map<ReactionType, number>();

    for (const r of reactors) {
      counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    }

    return REACTIONS.filter((r) => (counts.get(r.type) ?? 0) > 0)
      .map((r) => ({ ...r, count: counts.get(r.type) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [reactors]);

  const visible =
    tab === 'ALL'
      ? reactors
      : reactors.filter((r) => r.type === tab);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="People who reacted"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">Reactions</h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b px-3">
          <button
            type="button"
            onClick={() => setTab('ALL')}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              tab === 'ALL'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            All {reactors.length}
          </button>

          {tabs.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setTab(t.type)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                tab === t.type
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.emoji} {t.label} {t.count}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading…
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">
              {error}
            </p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No reactions yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((r) => {
                const meta = getReactionMeta(r.type);

                return (
                  <li
                    key={`${r.userId}-${r.type}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <UserLink
                      userId={r.userId}
                      name={r.name}
                      entity={r.entity}
                      suffix={
                        user?.id === r.userId && !r.entity
                          ? '(You)'
                          : undefined
                      }
                      onNavigate={onClose}
                    />

                    <span
                      className="shrink-0 text-lg"
                      title={meta?.label}
                    >
                      {meta?.emoji}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
