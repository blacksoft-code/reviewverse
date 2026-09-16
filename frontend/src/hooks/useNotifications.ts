'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  AppNotification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

    if (!token || !API_URL) return;

    // প্রথমবার পেজ লোড হলে existing notification + count আনা হচ্ছে
    getNotifications()
      .then((data) =>
        setNotifications(Array.isArray(data) ? data : []),
      )
      .catch(() => setNotifications([]));
    getUnreadCount()
      .then((res) => setUnreadCount(res?.count ?? 0))
      .catch(() => {});

    // real-time connection — নতুন notification এলেই top-এ বসবে ও count বাড়বে
    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification', (notification: AppNotification) => {
      setNotifications((prev) => [
        notification,
        ...(Array.isArray(prev) ? prev : []),
      ]);
      setUnreadCount((prev) => (Number.isFinite(prev) ? prev + 1 : 1));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, (prev ?? 0) - 1));
    await markNotificationRead(id).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) => ({
        ...n,
        isRead: true,
      })),
    );
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => {});
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}