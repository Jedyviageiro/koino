import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { Toast, type ToastMessage } from '@/components/app/Toast';
import { getNotifications } from '@/features/app/appService';
import { getAuthSession } from '@/features/auth/authStorage';
import { listenForNotificationResponses, registerDevicePushToken } from './deviceNotifications';
import { router } from 'expo-router';

const POLL_INTERVAL_MS = 12_000;

export function NotificationWatcher() {
  const knownIds = useRef(new Set<number>());
  const running = useRef(false);
  const mounted = useRef(true);
  const pushRegistered = useRef(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      if (!(await getAuthSession())) return;
      if (!pushRegistered.current) {
        pushRegistered.current = true;
        void registerDevicePushToken().catch(() => { pushRegistered.current = false; });
      }
      const notifications = await getNotifications();
      if (!mounted.current) return;
      const unseen = notifications
        .filter((item) => !item.read && !knownIds.current.has(item.notificationId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      notifications.forEach((item) => knownIds.current.add(item.notificationId));
      if (unseen[0]) {
        setToast({
          id: unseen[0].notificationId,
          tone: 'info',
          text: unseen[0].message ? `${unseen[0].title}: ${unseen[0].message}` : unseen[0].title,
        });
      }
    } catch {
      // Background polling must never interrupt the current screen.
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      mounted.current = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [check]);

  useEffect(() => {
    let dispose = () => {};
    let active = true;
    void listenForNotificationResponses((route) => router.push(route as never))
      .then((cleanup) => { if (active) dispose = cleanup; else cleanup(); })
      .catch(() => {});
    return () => { active = false; dispose(); };
  }, []);

  return <Toast message={toast} duration={4000} onDismiss={() => setToast(null)} />;
}
