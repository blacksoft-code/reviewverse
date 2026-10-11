'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';
import { createShare, getShareCount } from '@/services/share.service';

const CAPTION_MAX = 500;

// Review বা entity post-এর পাশে "↗ Share (N)" — N = মোট কতবার share হয়েছে।
// Share করলে নিজের profile/feed-এ একটা নতুন share তৈরি হয়।
export default function ShareButton({
  reviewId,
  entityPostId,
}: {
  reviewId?: string;
  entityPostId?: string;
}) {
  const { user } = useAuth();
  const { activeBusiness } = useBusinessContext();

  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getShareCount({ reviewId, entityPostId })
      .then((res) => {
        if (!cancelled) setCount(res.data.count);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reviewId, entityPostId]);

  async function handleShare() {
    setSubmitting(true);
    setMessage(null);

    try {
      await createShare({
        reviewId,
        entityPostId,
        caption: caption.trim() || undefined,
      });

      setCount((c) => c + 1);
      setCaption('');
      setOpen(false);
      setMessage('Shared to your profile');
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to share',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Business profile (entity mode)-এ share করা যায় না — শুধু count দেখায়
  if (activeBusiness) {
    return count > 0 ? (
      <span className="ml-4 text-sm font-medium text-gray-400">
        ↗ {count} {count === 1 ? 'share' : 'shares'}
      </span>
    ) : null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-4 text-sm font-medium text-gray-500 hover:underline"
      >
        ↗ Share
        {count > 0 && (
          <span className="ml-1 text-gray-400">({count})</span>
        )}
      </button>

      {message && (
        <span className="ml-3 text-xs text-green-600">{message}</span>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 text-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              Share {reviewId ? 'this review' : 'this post'}
            </h3>

            {!user ? (
              <p className="mt-3 text-sm text-gray-600">
                Please{' '}
                <Link href="/login" className="underline">
                  log in
                </Link>{' '}
                to share.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-500">
                  It will appear on your profile and in your
                  friends&apos; feeds.
                </p>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={CAPTION_MAX}
                  rows={3}
                  placeholder="Say something about this (optional)..."
                  className="mt-3 w-full rounded-lg border p-3 text-sm focus:outline-none"
                />

                <div className="mt-1 text-right text-xs text-gray-400">
                  {caption.length}/{CAPTION_MAX}
                </div>
              </>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={submitting}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? 'Sharing…' : 'Share now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
