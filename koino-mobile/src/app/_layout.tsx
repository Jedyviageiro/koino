import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '@/features/localization/LanguageProvider';
import { ToastProvider } from '@/components/app/Toast';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ToastProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </ToastProvider>
    </LanguageProvider>
  );
}
