import { router } from 'expo-router';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { useLanguage } from '@/features/localization/LanguageProvider';

export default function PreferencesScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  return <SettingsScreen title={pt ? 'Preferências' : 'Preferences'} subtitle={pt ? 'Personalize a sua experiência.' : 'Customize your experience.'}><SettingsSection><SettingsRow icon="bell-outline" title={pt ? 'Notificações' : 'Notifications'} subtitle={pt ? 'Veja atualizações e pedidos de amizade' : 'View updates and friend requests'} onPress={() => router.push('/notifications')} /><SettingsRow icon="web" title={pt ? 'Idioma' : 'Language'} subtitle={pt ? 'Escolha o seu idioma preferido' : 'Choose your preferred language'} onPress={() => router.push('/settings/language')} /></SettingsSection></SettingsScreen>;
}
