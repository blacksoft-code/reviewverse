'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  FeedEntry,
  getFeed,
  getNewSince,
} from '@/services/feed.service';

import FeedEntryCard from './FeedEntryCard';

const INITIAL_LOAD = 30;
const PAGE_SIZE = 10;

// এর কতগুলো item আগে (শেষের দিক থেকে) পৌঁছালে পরের ব্যাচ লোড হবে
// (INITIAL_LOAD=30, PAGE_SIZE=10 হলে item #21-এ পৌঁছালে পরের ১০টা লোড হবে)
const LOAD_MORE_THRESHOLD = 10;

const POLL_INTERVAL_MS = 25000;
const PULL_TO_REFRESH_THRESHOLD = 70;

export default function FeedSection() {
  const [items, setItems] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const [newCount, setNewCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // একবার দেখা post/review আবার session-এ দেখানো ঠেকাতে
  const seenIdsRef = useRef<Set<string>>(new Set());

  // polling-এর জন্য: এর পরের নতুন item-ই "নতুন" হিসেবে গোনা হবে
  const lastFetchedAtRef = useRef<string>(
    new Date().toISOString(),
  );

  const observerRef =
    useRef<IntersectionObserver | null>(null);

  // ─────────────────────────────
  // Initial load
  // ─────────────────────────────
  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const response = await getFeed(
        0,
        INITIAL_LOAD,
      );

      const { items: fresh, hasMore: more } =
        response.data;

      seenIdsRef.current = new Set(
        fresh.map((f) => f.id),
      );
      lastFetchedAtRef.current = now;

      setItems(fresh);
      setHasMore(more);
      setNewCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'You have to login to see Feed.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────
  // Load more (infinite scroll)
  // ─────────────────────────────
  const loadMore = useCallback(async () => {
    setLoadingMore((current) => {
      if (current) return current;
      return true;
    });
  }, []);

  useEffect(() => {
    if (!loadingMore) return;

    (async () => {
      try {
        const response = await getFeed(
          items.length,
          PAGE_SIZE,
        );

        const { items: nextItems, hasMore: more } =
          response.data;

        // Duplicate/seen filtering — একবার দেখা id আবার যোগ হবে না
        const unseen = nextItems.filter(
          (entry) =>
            !seenIdsRef.current.has(entry.id),
        );

        unseen.forEach((entry) =>
          seenIdsRef.current.add(entry.id),
        );

        setItems((prev) => [...prev, ...unseen]);
        setHasMore(more);
      } catch {
        // load-more ব্যর্থ হলে চুপচাপ থামানো হচ্ছে,
        // user স্ক্রল করলে আবার ট্রাই হবে
      } finally {
        setLoadingMore(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore]);

  // ─────────────────────────────
  // Infinite scroll trigger — শেষ থেকে ১০ নম্বর item দেখা
  // গেলেই পরের ব্যাচ fetch হবে
  // ─────────────────────────────
  const triggerIndex =
    items.length - LOAD_MORE_THRESHOLD;

  const triggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !loadingMore
          ) {
            loadMore();
          }
        },
        { rootMargin: '200px' },
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore],
  );

  // ─────────────────────────────
  // Refresh — pagination state reset করে সবচেয়ে ফ্রেশ post লোড করা
  // ─────────────────────────────
  async function refresh() {
    setRefreshing(true);

    try {
      const now = new Date().toISOString();
      const response = await getFeed(
        0,
        INITIAL_LOAD,
      );

      const { items: fresh, hasMore: more } =
        response.data;

      seenIdsRef.current = new Set(
        fresh.map((f) => f.id),
      );
      lastFetchedAtRef.current = now;

      setItems(fresh);
      setHasMore(more);
      setNewCount(0);
      setError(null);
    } catch {
      // refresh ব্যর্থ হলে আগের list-ই থেকে যাবে
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }

  // ─────────────────────────────
  // Polling — scroll করার মাঝে friend/followed business-এর
  // নতুন post/review এসেছে কিনা চেক করা
  // ─────────────────────────────
  useEffect(() => {
    if (loading || error) return;

    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      try {
        const response = await getNewSince(
          lastFetchedAtRef.current,
        );

        if (response.data.count > 0) {
          setNewCount(response.data.count);
        }
      } catch {
        // polling ব্যর্থ হলে চুপচাপ ignore, পরের বার আবার ট্রাই
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loading, error]);

  // ─────────────────────────────
  // Pull-to-refresh (mobile touch gesture, পেজের একদম উপরে থাকলে)
  // ─────────────────────────────
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY <= 0) {
        touchStartYRef.current = e.touches[0].clientY;
      } else {
        touchStartYRef.current = null;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (touchStartYRef.current === null) return;

      const delta =
        e.touches[0].clientY -
        touchStartYRef.current;

      if (delta > 0 && window.scrollY <= 0) {
        setPullDistance(Math.min(delta, 120));
      }
    }

    function handleTouchEnd() {
      if (touchStartYRef.current === null) return;

      setPullDistance((current) => {
        if (current > PULL_TO_REFRESH_THRESHOLD) {
          refresh();
        } else {
          setPullDistance(0);
        }
        return current;
      });

      touchStartYRef.current = null;
    }

    window.addEventListener(
      'touchstart',
      handleTouchStart,
      { passive: true },
    );
    window.addEventListener(
      'touchmove',
      handleTouchMove,
      { passive: true },
    );
    window.addEventListener(
      'touchend',
      handleTouchEnd,
    );

    return () => {
      window.removeEventListener(
        'touchstart',
        handleTouchStart,
      );
      window.removeEventListener(
        'touchmove',
        handleTouchMove,
      );
      window.removeEventListener(
        'touchend',
        handleTouchEnd,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold">
        Feed
      </h2>

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center text-xs text-gray-400 transition-all"
          style={{
            height: refreshing
              ? 40
              : Math.min(pullDistance, 60),
          }}
        >
          {refreshing
            ? 'Refreshing...'
            : pullDistance >
                PULL_TO_REFRESH_THRESHOLD
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </div>
      )}

      {/* New posts banner */}
      {newCount > 0 && (
        <button
          type="button"
          onClick={refresh}
          className="mt-4 w-full rounded-lg bg-black py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          ↑ {newCount} new post
          {newCount > 1 ? 's' : ''} — tap to refresh
        </button>
      )}

      {error && (
        <p className="mt-4 text-sm text-gray-500">
          {error}
        </p>
      )}

      {!error && loading && (
        <p className="mt-4 text-sm text-gray-500">
          Loading...
        </p>
      )}

      {!error &&
        !loading &&
        items.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            No posts yet.
          </p>
        )}

      {!error && !loading && items.length > 0 && (
        <div className="mt-4 space-y-4">
          {items.map((entry, index) => (
            <div
              key={entry.id}
              ref={
                index === triggerIndex
                  ? triggerRef
                  : undefined
              }
            >
              <FeedEntryCard entry={entry} />
            </div>
          ))}

          {loadingMore && (
            <p className="text-center text-sm text-gray-400">
              Loading more...
            </p>
          )}

          {!hasMore && items.length > 0 && (
            <p className="text-center text-sm text-gray-400">
              You&apos;re all caught up.
            </p>
          )}
        </div>
      )}
    </section>
  );
}