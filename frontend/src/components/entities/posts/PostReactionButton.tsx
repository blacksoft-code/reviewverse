'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ReactionType,
  getPostReactionSummary,
  reactToPost,
  unreactToPost,
} from '@/services/post-reaction.service';

const REACTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}[] = [
  {
    type: 'HELPFUL',
    emoji: '👍',
    label: 'Helpful',
    color: 'text-blue-600',
  },
  {
    type: 'LOVE',
    emoji: '❤️',
    label: 'Love',
    color: 'text-red-600',
  },
  {
    type: 'ACCURATE',
    emoji: '🎯',
    label: 'Accurate',
    color: 'text-green-600',
  },
  {
    type: 'HAHA',
    emoji: '😂',
    label: 'Haha',
    color: 'text-yellow-500',
  },
  {
    type: 'DISLIKE',
    emoji: '👎',
    label: 'Dislike',
    color: 'text-gray-600',
  },
];

function getMeta(type: ReactionType | null) {
  return REACTIONS.find((r) => r.type === type) ?? null;
}

export default function PostReactionButton({
  postId,
}: {
  postId: string;
}) {
  const [myReaction, setMyReaction] =
    useState<ReactionType | null>(null);
  const [total, setTotal] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [loading, setLoading] = useState(false);

  const hoverTimeout = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getPostReactionSummary(
          postId,
        );
        setMyReaction(res.data.myReaction);
        setTotal(res.data.total);
      } catch {
        // ignore
      }
    }
    load();
  }, [postId]);

  function handleMouseEnter() {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(
      () => setShowPalette(true),
      300,
    );
  }

  function handleMouseLeave() {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
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
        await unreactToPost(postId);
        setMyReaction(null);
        setTotal((t) => Math.max(0, t - 1));
      } else {
        await reactToPost(postId, type);
        setMyReaction(type);
        setTotal((t) => (previous ? t : t + 1));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleMainClick() {
    applyReaction(myReaction ?? 'HELPFUL');
  }

  const activeMeta = getMeta(myReaction);

  return (
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
        onClick={handleMainClick}
        disabled={loading}
        className={`text-sm font-medium disabled:opacity-50 ${
          activeMeta ? activeMeta.color : 'text-gray-500'
        } hover:underline`}
      >
        {activeMeta
          ? `${activeMeta.emoji} ${activeMeta.label}`
          : '👍 Like'}
        {total > 0 && (
          <span className="ml-1 text-gray-400">
            ({total})
          </span>
        )}
      </button>
    </div>
  );
}