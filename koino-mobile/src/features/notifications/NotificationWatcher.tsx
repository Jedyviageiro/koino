import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { Toast, type ToastMessage } from '@/components/app/Toast';
import { getNotifications } from '@/features/app/appService';
import { getAuthSession } from '@/features/auth/authStorage';

const POLL_INTERVAL_MS = 12_000;

export function NotificationWatcher() {
  const knownIds = useRef(new Set<number>());
  const running = useRef(false);
  const mounted = useRef(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      if (!(await getAuthSession())) return;
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

  return <Toast message={toast} duration={4000} onDismiss={() => setToast(null)} />;
}
