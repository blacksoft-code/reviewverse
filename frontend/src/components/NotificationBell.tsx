'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useBusinessContext } from '../context/BusinessContext';
import {
  AppNotification,
  emitNotificationsChanged,
  getNotificationHistory,
  markScopeAsRead,
} from '../services/notification.service';

// প্রথমে ১০টা দেখানো হয়, scroll করলে আরও ১০টা করে আসে
const PAGE_SIZE = 10;

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// এই টাইপগুলো সবসময় business-এর — কারণ এগুলো user নিজে review/post করেননি,
// বরং তার manage করা business-এর review/post/entity-তে ঘটেছে।
// ⚠️ backend-এর notifications.service.ts-এর BUSINESS_NOTIFICATION_TYPES-এর সাথে মিল রাখতে হবে
const BUSINESS_NOTIFICATION_TYPES = new Set([
  'NEW_REVIEW',
  'NEW_ENTITY_FOLLOWER',
  'POST_REACTION',
  'POST_COMMENT',
  'POST_REPLY',
  'CLAIM_APPROVED',
  'CLAIM_REJECTED',
  'QUESTION_ASKED',
]);

export default function NotificationBell() {
  const { notifications, markAsRead } = useNotifications();
  const { activeBusiness } = useBusinessContext();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // mode (business/personal) বদলালে পুরনো request-এর উত্তর যেন বসে না যায়
  const requestId = useRef(0);

  const entityId = activeBusiness?.id ?? null;

  // Badge-এর সংখ্যা: business mode-এ ঐ business-এর, personal mode-এ personal
  const visibleUnreadCount = notifications.filter((n) => {
    if (n.isRead) return false;

    return activeBusiness
      ? BUSINESS_NOTIFICATION_TYPES.has(n.type) &&
          n.entityId === activeBusiness.id
      : !BUSINESS_NOTIFICATION_TYPES.has(n.type);
  }).length;

  // Bell খুললে (বা mode বদলালে) প্রথম ১০টা আনা হয়
  useEffect(() => {
    if (!open) return;

    const current = ++requestId.current;

    setLoading(true);
    setItems([]);
    setNextCursor(null);

    getNotificationHistory({ limit: PAGE_SIZE, entityId })
      .then((page) => {
        if (current !== requestId.current) return;

        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (current !== requestId.current) return;

        setItems([]);
        setNextCursor(null);
      })
      .finally(() => {
        if (current === requestId.current) setLoading(false);
      });
  }, [open, entityId]);

  // Bell খোলা অবস্থায় নতুন real-time notification এলে সবার উপরে বসবে
  const latest = notifications[0];

  useEffect(() => {
    if (!open || !latest) return;

    const inScope = activeBusiness
      ? BUSINESS_NOTIFICATION_TYPES.has(latest.type) &&
        latest.entityId === activeBusiness.id
      : !BUSINESS_NOTIFICATION_TYPES.has(latest.type);

    if (!inScope) return;

    setItems((prev) =>
      prev.some((i) => i.id === latest.id)
        ? prev
        : [latest, ...prev],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  // নিচে পৌঁছালে পরের ১০টা
  async function loadMore() {
    if (!nextCursor || loadingMore || loading) return;

    const current = requestId.current;

    try {
      setLoadingMore(true);

      const page = await getNotificationHistory({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        entityId,
      });

      if (current !== requestId.current) return;

      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));

        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      // নেটওয়ার্ক সমস্যা হলে আবার scroll করলে চেষ্টা হবে
    } finally {
      setLoadingMore(false);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;

    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      loadMore();
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markScopeAsRead(entityId);

      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));

      // badge আর hook-এর list আপডেট করতে
      emitNotificationsChanged();
    } catch {
      // ব্যর্থ হলে কিছু বদলায় না
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleClickNotification(n: AppNotification) {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)),
      );
      markAsRead(n.id);
    }

    setOpen(false);

    if (n.link) {
      // router.push() মাঝেমধ্যে ভুল cached route দেখাচ্ছিল (Next.js router-cache
      // বাগ), তাই hard navigation দিয়ে পুরোপুরি fresh page লোড করা হচ্ছে
      window.location.href = n.link;
    }
  }

  const hasUnreadInList = items.some((i) => !i.isRead);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-gray-50 ${
          open ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-gray-700"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {visibleUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-base font-semibold text-gray-900">
              {activeBusiness
                ? `${activeBusiness.name}`
                : 'Notifications'}
            </span>

            {hasUnreadInList && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div
            onScroll={handleScroll}
            className="max-h-[26rem] overflow-y-auto"
          >
            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">
                No notifications yet.
              </p>
            ) : (
              <>
                {items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickNotification(n)}
                    className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                      n.isRead ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {(n.actor?.name ?? n.message ?? '?').charAt(0).toUpperCase()}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-gray-800">
                        {/* actor না থাকলে (যেমন business reply করলে) শুধু message */}
                        {n.actor && (
                          <>
                            <span className="font-semibold">
                              {n.actor.name}
                            </span>{' '}
                          </>
                        )}
                        {n.message}
                      </span>

                      <span
                        className={`mt-0.5 block text-xs ${
                          n.isRead
                            ? 'text-gray-400'
                            : 'font-medium text-blue-600'
                        }`}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>

                    {!n.isRead && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}

                {loadingMore && (
                  <p className="px-4 py-3 text-center text-xs text-gray-400">
                    Loading...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}