import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '@/features/localization/LanguageProvider';
import { ToastProvider } from '@/components/app/Toast';
import { configureNotificationPresentation } from '@/features/notifications/deviceNotifications';
import { NotificationWatcher } from '@/features/notifications/NotificationWatcher';
import { AppErrorBoundary } from '@/components/app/AppErrorBoundary';

void configureNotificationPresentation();

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AppErrorBoundary>
        <ToastProvider>
          <StatusBar style="dark" />
          <NotificationWatcher />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </ToastProvider>
      </AppErrorBoundary>
    </LanguageProvider>
  );
}
