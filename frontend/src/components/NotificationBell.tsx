'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useBusinessContext } from '../context/BusinessContext';
import { AppNotification } from '../services/notification.service';

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
// বরং তার manage করা business-এর review/post/entity-তে ঘটেছে
const BUSINESS_NOTIFICATION_TYPES = new Set([
  'NEW_REVIEW',
  'NEW_ENTITY_FOLLOWER',
  'POST_REACTION',
  'POST_COMMENT',
  'POST_REPLY',
  'CLAIM_APPROVED',
  'CLAIM_REJECTED',
]);

export default function NotificationBell() {
  const { notifications, markAsRead } = useNotifications();
  const { activeBusiness } = useBusinessContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Business mode-এ থাকলে শুধু ঐ business-এর business-type notification,
  // personal profile mode-এ থাকলে personal notification (review reaction/comment/
  // reply, follow, friend request ইত্যাদি) — actor friend/follow/stranger যেই হোক
  const visibleNotifications = activeBusiness
    ? notifications.filter(
        (n) =>
          BUSINESS_NOTIFICATION_TYPES.has(n.type) &&
          n.entityId === activeBusiness.id,
      )
    : notifications.filter(
        (n) => !BUSINESS_NOTIFICATION_TYPES.has(n.type),
      );

  const visibleUnreadCount = visibleNotifications.filter(
    (n) => !n.isRead,
  ).length;

  function handleMarkAllAsRead() {
    // শুধু বর্তমানে visible (business বা personal) notification-গুলোই read করা হচ্ছে
    visibleNotifications
      .filter((n) => !n.isRead)
      .forEach((n) => markAsRead(n.id));
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
    if (!n.isRead) markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      // router.push() মাঝেমধ্যে ভুল cached route দেখাচ্ছিল (Next.js router-cache
      // বাগ), তাই hard navigation দিয়ে পুরোপুরি fresh page লোড করা হচ্ছে
      window.location.href = n.link;
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
      >
        🔔
        {visibleUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-semibold">
              {activeBusiness
                ? `${activeBusiness.name} Notifications`
                : 'Notifications'}
            </span>
            {visibleUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet.
              </p>
            ) : (
              visibleNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className={`block w-full border-b px-4 py-3 text-left text-sm hover:bg-gray-50 ${
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
                    {timeAgo(n.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}