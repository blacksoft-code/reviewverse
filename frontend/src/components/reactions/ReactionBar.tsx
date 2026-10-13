'use client';

import { useEffect, useRef, useState } from 'react';

import type {
  Reactor,
  ReactionSummary,
  ReactionType,
} from '@/services/reaction.service';

import ReactorsModal from './ReactorsModal';
import {
  DEFAULT_REACTION,
  REACTIONS,
  getReactionMeta,
} from './reaction-meta';

// review / post / share — তিন জায়গার reaction button-এর একই UI ও লজিক।
// প্রতিটা জায়গা শুধু নিজের API-গুলো adapter হিসেবে দেয়।
export type ReactionAdapter = {
  getSummary: () => Promise<{ data: ReactionSummary }>;
  react: (type: ReactionType) => Promise<unknown>;
  unreact: () => Promise<unknown>;
  getReactors: () => Promise<{ data: Reactor[] }>;
};

const EMPTY_COUNTS: Record<ReactionType, number> = {
  HELPFUL: 0,
  LOVE: 0,
  ACCURATE: 0,
  HAHA: 0,
  DISLIKE: 0,
};

export default function ReactionBar({
  targetId,
  adapter,
}: {
  // কোন review/post/share — বদলালে summary আবার load হয়
  targetId: string;
  adapter: ReactionAdapter;
}) {
  const [myReaction, setMyReaction] =
    useState<ReactionType | null>(null);
  const [counts, setCounts] =
    useState<Record<ReactionType, number>>(EMPTY_COUNTS);
  const [total, setTotal] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const hoverTimeout = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    adapter
      .getSummary()
      .then((res) => {
        setMyReaction(res.data.myReaction);
        setCounts({ ...EMPTY_COUNTS, ...res.data.counts });
        setTotal(res.data.total);
      })
      .catch(() => {
        // লগইন না থাকলেও summary আসার কথা — ব্যর্থ হলে চুপচাপ ignore
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  function handleMouseEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(
      () => setShowPalette(true),
      300,
    );
  }

  function handleMouseLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(
      () => setShowPalette(false),
      200,
    );
  }

  async function applyReaction(type: ReactionType) {
    setShowPalette(false);
    setLoading(true);

    const previous = myReaction;

    try {
      if (previous === type) {
        // একই reaction-এ আবার ক্লিক করলে remove হয়ে যাবে
        await adapter.unreact();
        setMyReaction(null);
        setTotal((t) => Math.max(0, t - 1));
        setCounts((c) => ({
          ...c,
          [type]: Math.max(0, c[type] - 1),
        }));
      } else {
        await adapter.react(type);
        setMyReaction(type);
        setTotal((t) => (previous ? t : t + 1));
        setCounts((c) => ({
          ...c,
          [type]: c[type] + 1,
          ...(previous
            ? { [previous]: Math.max(0, c[previous] - 1) }
            : {}),
        }));
      }
    } catch {
      // silent — পরে আবার চেষ্টা করা যাবে
    } finally {
      setLoading(false);
    }
  }

  const activeMeta = getReactionMeta(myReaction);

  // সবচেয়ে বেশি পাওয়া সর্বোচ্চ ৩টা reaction — Facebook-এর মতো পাশাপাশি
  const topReactions = REACTIONS.filter((r) => counts[r.type] > 0)
    .sort((a, b) => counts[b.type] - counts[a.type])
    .slice(0, 3);

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showPalette && (
          <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border bg-white px-2 py-1.5 shadow-lg">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                type="button"
                title={r.label}
                onClick={() => applyReaction(r.type)}
                className="text-2xl transition hover:-translate-y-1 hover:scale-125"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => applyReaction(myReaction ?? DEFAULT_REACTION)}
          disabled={loading}
          className={`text-sm font-medium disabled:opacity-50 ${
            activeMeta ? activeMeta.color : 'text-gray-500'
          } hover:underline`}
        >
          {activeMeta
            ? `${activeMeta.emoji} ${activeMeta.label}`
            : `${getReactionMeta(DEFAULT_REACTION)?.emoji} ${
                getReactionMeta(DEFAULT_REACTION)?.label
              }`}
        </button>
      </div>

      {/* Facebook-এর মতো: top ৩ reaction + "N reacted" — click করলে কে কে react করেছে */}
      {total > 0 && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:underline"
          title="See who reacted"
        >
          <span className="flex -space-x-1">
            {topReactions.map((r) => (
              <span
                key={r.type}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs ring-1 ring-gray-200"
              >
                {r.emoji}
              </span>
            ))}
          </span>

          <span>{total} reacted</span>
        </button>
      )}

      {showModal && (
        <ReactorsModal
          onClose={() => setShowModal(false)}
          fetchReactors={adapter.getReactors}
        />
      )}
    </div>
  );
}
