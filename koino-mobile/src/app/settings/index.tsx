import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { getSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';

export default function SettingsHomeScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [user, setUser] = useState<UserSettings | null>(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { let active = true; getSettings().then((value) => { if (active) setUser(value); }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar as definições.' : 'Unable to load settings.'); }); return () => { active = false; }; }, [pt]));
  const countryNames: Record<string, string> = { MZ: pt ? 'Moçambique' : 'Mozambique', BR: pt ? 'Brasil' : 'Brazil', PT: 'Portugal', AO: 'Angola', US: pt ? 'Estados Unidos' : 'United States', ZA: pt ? 'África do Sul' : 'South Africa' };
  const place = user ? [user.location, user.countryCode ? countryNames[user.countryCode] ?? user.countryCode : null].filter(Boolean).join(', ') : '';
  return (
    <SettingsScreen title={pt ? 'Definições' : 'Settings'} subtitle={pt ? 'Gerencie o seu perfil, preferências e conta.' : 'Manage your profile, preferences, and account.'} back={false}>
      {!user && !error ? <LoadingState label={pt ? 'A carregar definições…' : 'Loading settings…'} /> : null}
      <Pressable onPress={() => router.push('/settings/edit-profile')} style={styles.profile}>
        <Avatar name={user?.fullname ?? 'Koino reader'} uri={user?.profilePictureUrl} size={52} />
        <View style={styles.profileCopy}><Text style={styles.name}>{user?.fullname ?? (pt ? 'Seu perfil' : 'Your profile')}</Text><Text style={styles.profileHint}>{pt ? 'Ver e editar o perfil' : 'View and edit your profile'}</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={21} color="#647184" />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SettingsSection title={pt ? 'Conta' : 'Account'}>
        <SettingsRow icon="account-outline" title={pt ? 'Definições da conta' : 'Account Settings'} onPress={() => router.push('/settings/account')} />
        <SettingsRow icon="account-plus-outline" title={pt ? 'Adicionar amigos' : 'Add Friends'} onPress={() => router.push('/settings/add-friends')} />
      </SettingsSection>
      <SettingsSection title={pt ? 'Preferências' : 'Preferences'}>
        <SettingsRow icon="bookmark-outline" title={pt ? 'Versículos guardados' : 'Saved Verses'} onPress={() => router.push('/settings/saved')} />
        <SettingsRow icon="map-marker-outline" title={pt ? 'Localização' : 'Location'} subtitle={place || (pt ? 'Adicionar cidade e país' : 'Add your city and country')} onPress={() => router.push('/settings/edit-profile')} />
        <SettingsRow icon="bell-outline" title={pt ? 'Notificações' : 'Notifications'} subtitle={pt ? 'Atualizações e pedidos de amizade' : 'Updates and friend requests'} onPress={() => router.push('/notifications')} />
        <SettingsRow icon="web" title={pt ? 'Idioma' : 'Language'} subtitle={language === 'pt' ? 'Português' : 'English'} onPress={() => router.push('/settings/language')} />
      </SettingsSection>
      <SettingsSection title="Koino">
        <SettingsRow icon="information-outline" title={pt ? 'Sobre o Koino' : 'About Koino'} subtitle={pt ? 'Versão, missão e informações da aplicação' : 'Version, mission, and app information'} onPress={() => router.push('/settings/about')} />
      </SettingsSection>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  profile: { minHeight: 84, padding: 14, borderWidth: 1, borderColor: '#e3e6e9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  profileCopy: { flex: 1, marginLeft: 14 }, name: { color: '#17202a', fontSize: 17, fontWeight: '700' }, profileHint: { marginTop: 4, color: '#788291', fontSize: 12 }, error: { color: '#a33b32', fontSize: 12 },
});
