'use client';

import { useEffect, useRef, useState } from 'react';

import {
  blockEntity,
  followEntity,
  getEntityRelationshipStatus,
  unblockEntity,
  unfollowEntity,
} from '@/services/user.service';

type EntityActionsProps = {
  entityId: string;
  // "Message" এখনো কোনো page-এর সাথে যুক্ত না — যুক্ত হলে এখানে handler দিলেই হবে
  onMessage?: () => void;
};

// Follow বাটন + "⋯" menu। Message আর Block এখন ঐ menu-র ভেতরে।
export default function EntityActions({
  entityId,
  onMessage,
}: EntityActionsProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function showError(error: unknown) {
    alert(
      error instanceof Error
        ? error.message
        : 'Something went wrong',
    );
  }

  async function handleFollow() {
    try {
      setLoading('follow');
      await followEntity(entityId);
      setIsFollowing(true);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(null);
    }
  }

  async function handleUnfollow() {
    try {
      setLoading('follow');
      await unfollowEntity(entityId);
      setIsFollowing(false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(null);
    }
  }

  async function handleBlock() {
    setMenuOpen(false);

    try {
      setLoading('block');
      await blockEntity(entityId);

      // block-এর পর entity page আর available থাকে না — reload করলে
      // BlockGuard "not available" দেখাবে
      window.location.reload();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(null);
    }
  }

  async function handleUnblock() {
    setMenuOpen(false);

    try {
      setLoading('block');
      await unblockEntity(entityId);
      setIsBlocked(false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    async function loadStatus() {
      try {
        const result =
          await getEntityRelationshipStatus(entityId);

        setIsFollowing(result.data.isFollowing);
        setIsBlocked(result.data.isBlocked);
      } catch {
        // login করা না থাকলে status পাওয়া যায় না — default অবস্থাই থাকবে
      }
    }

    loadStatus();
  }, [entityId]);

  // বাইরে click বা Esc চাপলে menu বন্ধ
  useEffect(() => {
    if (!menuOpen) return;

    function onClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const menuItemClass =
    'block w-full px-4 py-2.5 text-left text-sm hover:bg-black/5 disabled:opacity-50';

  return (
    <div className="flex items-center gap-2.5">
      {!isBlocked && (
        <button
          type="button"
          onClick={isFollowing ? handleUnfollow : handleFollow}
          disabled={loading === 'follow'}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            isFollowing
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {loading === 'follow'
            ? 'Loading...'
            : isFollowing
              ? 'Unfollow'
              : 'Follow'}
        </button>
      )}

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="More options"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white transition hover:bg-white/20"
        >
          ⋯
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
          >
            {!isBlocked && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onMessage?.();
                }}
                className={`${menuItemClass} text-[#1d1d1f]`}
              >
                Message
              </button>
            )}

            {isBlocked ? (
              <button
                type="button"
                role="menuitem"
                onClick={handleUnblock}
                disabled={loading === 'block'}
                className={`${menuItemClass} text-[#1d1d1f]`}
              >
                {loading === 'block' ? 'Loading...' : 'Unblock'}
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={handleBlock}
                disabled={loading === 'block'}
                className={`${menuItemClass} text-red-600`}
              >
                {loading === 'block' ? 'Loading...' : 'Block'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
