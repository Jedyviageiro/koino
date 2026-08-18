import { router } from 'expo-router';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';

export default function PreferencesScreen() {
  return <SettingsScreen title="Preferences" subtitle="Customize your experience."><SettingsSection><SettingsRow icon="bell-outline" title="Notifications" subtitle="Manage your notification preferences" onPress={() => router.push('/settings/notification-preferences')} /><SettingsRow icon="web" title="Language" subtitle="Choose your preferred language" onPress={() => router.push('/settings/language')} /></SettingsSection></SettingsScreen>;
}
