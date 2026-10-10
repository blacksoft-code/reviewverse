import { apiFetch } from '../lib/api';

export type NotificationType =
  | 'NEW_REVIEW'
  | 'REVIEW_REACTION'
  | 'REVIEW_COMMENT'
  | 'REVIEW_REPLY'
  | 'POST_REACTION'
  | 'POST_COMMENT'
  | 'POST_REPLY'
  | 'NEW_FOLLOWER'
  | 'NEW_ENTITY_FOLLOWER'
  | 'FRIEND_REQUEST'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'QUESTION_ASKED'
  | 'QUESTION_ANSWERED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string } | null;
}

// Backend সব response { success, data, ... }-তে মুড়ে পাঠায় — ভেতরের data বের করা
function unwrap<T>(res: unknown): T {
  if (
    res &&
    typeof res === 'object' &&
    'success' in res &&
    'data' in res
  ) {
    return (res as { data: T }).data;
  }

  return res as T;
}

// UI-এর অন্য অংশকে (bell-এর badge/list) জানানো যে notification বদলেছে
export function emitNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('notifications:changed'));
  }
}

export async function getNotifications() {
  const res = await apiFetch<unknown>('/notifications');

  return unwrap<AppNotification[]>(res);
}

export async function getUnreadCount() {
  const res = await apiFetch<unknown>(
    '/notifications/unread-count',
  );

  return unwrap<{ count: number }>(res);
}

// গত ৩০ দিনের history, পেজ ধরে ধরে
export type NotificationHistoryPage = {
  items: AppNotification[];
  nextCursor: string | null;
  retentionDays: number;
};

export async function getNotificationHistory(options: {
  cursor?: string | null;
  limit?: number;
  entityId?: string | null;
}) {
  const params = new URLSearchParams();

  if (options.cursor) params.set('cursor', options.cursor);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.entityId) params.set('entityId', options.entityId);

  const query = params.toString();

  const res = await apiFetch<unknown>(
    `/notifications/history${query ? `?${query}` : ''}`,
  );

  return unwrap<NotificationHistoryPage>(res);
}

export function markNotificationRead(id: string) {
  return apiFetch<{ message: string }>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
}

export function markAllNotificationsRead() {
  return apiFetch<{ message: string }>(
    '/notifications/read-all',
    { method: 'PATCH' },
  );
}

// business mode-এ entityId দিলে শুধু ঐ business-এর, না দিলে personal
export function markScopeAsRead(entityId?: string | null) {
  const query = entityId
    ? `?entityId=${encodeURIComponent(entityId)}`
    : '?scope=personal';

  return apiFetch<{ message: string }>(
    `/notifications/read-all${query}`,
    { method: 'PATCH' },
  );
}