'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';
import {
  AppNotification,
  emitNotificationsChanged,
  getNotificationHistory,
  markNotificationRead,
  markScopeAsRead,
} from '@/services/notification.service';

const PAGE_SIZE = 20;

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

// আজ / গতকাল / তারিখ — দিন অনুযায়ী ভাগ করার label
function dayLabel(dateStr: string) {
  const date = new Date(dateStr);

  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) /
      (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeLabel(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeBusiness } = useBusinessContext();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] =
    useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityId = activeBusiness?.id ?? null;

  // business বা personal mode বদলালে প্রথম পেজ থেকে আবার
  const loadFirstPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await getNotificationHistory({
        limit: PAGE_SIZE,
        entityId,
      });

      setItems(page.items);
      setNextCursor(page.nextCursor);
      setRetentionDays(page.retentionDays);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    if (authLoading || !user) return;

    loadFirstPage();
  }, [authLoading, user, loadFirstPage]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;

    try {
      setLoadingMore(true);

      const page = await getNotificationHistory({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        entityId,
      });

      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong',
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) {
      setItems((current) =>
        current.map((i) =>
          i.id === n.id ? { ...i, isRead: true } : i,
        ),
      );

      await markNotificationRead(n.id).catch(() => {});
      emitNotificationsChanged();
    }

    if (n.link) {
      // bell-এর মতো hard navigation (Next.js router-cache বাগ এড়াতে)
      window.location.href = n.link;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markScopeAsRead(entityId);

      setItems((current) =>
        current.map((i) => ({ ...i, isRead: true })),
      );

      emitNotificationsChanged();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Something went wrong',
      );
    }
  };

  const hasUnread = items.some((i) => !i.isRead);

  if (authLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-gray-500">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-gray-500">
        Please log in to see your notifications.
      </main>
    );
  }

  // দিন অনুযায়ী ভাগ (items আগে থেকেই নতুন → পুরনো সাজানো)
  const groups: { label: string; items: AppNotification[] }[] =
    [];

  for (const n of items) {
    const label = dayLabel(n.createdAt);
    const last = groups[groups.length - 1];

    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeBusiness
              ? `${activeBusiness.name} Notifications`
              : 'Notifications'}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            History of the last {retentionDays} days. Older
            notifications are deleted automatically.
          </p>
        </div>

        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="shrink-0 text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Loading notifications...
          </p>
        ) : error ? (
          <p className="py-10 text-center text-red-600">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">🔔</div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No notifications
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Nothing in the last {retentionDays} days.
            </p>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <section key={group.label} className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-500">
                  {group.label}
                </h2>

                <div className="overflow-hidden rounded-xl border bg-white">
                  {group.items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                        n.isRead ? 'bg-white' : 'bg-blue-50'
                      }`}
                    >
                      <p>
                        <span className="font-medium">
                          {n.actor?.name ?? 'Someone'}
                        </span>{' '}
                        {n.message}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {timeLabel(n.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {nextCursor && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
