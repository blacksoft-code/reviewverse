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
  | 'CLAIM_REJECTED';

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

export function getNotifications() {
  return apiFetch<AppNotification[]>('/notifications');
}

export function getUnreadCount() {
  return apiFetch<{ count: number }>(
    '/notifications/unread-count',
  );
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
