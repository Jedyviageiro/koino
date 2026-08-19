import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { clearAuthSession } from '@/features/auth/authStorage';
import { deactivateAccount, getSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { ActionSheet } from '@/components/app/ActionSheet';
import { Toast, type ToastMessage } from '@/components/app/Toast';

export default function AccountSettingsScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [user, setUser] = useState<UserSettings | null>(null);
  const [confirming, setConfirming] = useState(false); const [busy, setBusy] = useState(false); const [toast, setToast] = useState<ToastMessage | null>(null);
  useEffect(() => { getSettings().then(setUser).catch(() => {}); }, []);
  async function confirmDeactivate() { if (busy) return; setBusy(true); try { await deactivateAccount(); await clearAuthSession(); router.replace('/'); } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível desativar a conta.' : 'Unable to deactivate your account.' }); } finally { setBusy(false); } }
  return (
    <SettingsScreen title={pt ? 'Definições da conta' : 'Account Settings'} subtitle={pt ? 'Gerencie os dados e a segurança da sua conta.' : 'Manage your account details and security.'}>
      <SettingsSection title={pt ? 'Informações da conta' : 'Account Information'}>
        <SettingsRow icon="account-edit-outline" title={pt ? 'Editar perfil' : 'Edit Profile'} subtitle={pt ? 'Atualize os seus dados pessoais' : 'Update your personal information'} onPress={() => router.push('/settings/edit-profile')} />
        <SettingsRow icon="at" title={pt ? 'Nome de utilizador' : 'Username'} subtitle={user?.username ? `@${user.username}` : pt ? 'A carregar…' : 'Loading...'} />
        <SettingsRow icon="email-outline" title="Email" subtitle={user?.email ?? (pt ? 'A carregar…' : 'Loading...')} />
        <SettingsRow icon="key-outline" title={pt ? 'Palavra-passe' : 'Password'} subtitle={pt ? 'Redefina a sua palavra-passe' : 'Reset your password securely'} onPress={() => router.push('/forgot-password')} />
        <SettingsRow icon="clock-outline" title={pt ? 'Fuso horário' : 'Time Zone'} subtitle={user?.timeZone ?? 'Africa/Maputo'} onPress={() => router.push('/settings/edit-profile')} />
      </SettingsSection>
      <SettingsSection title={pt ? 'Ações da conta' : 'Account Actions'}>
        <SettingsRow icon="delete-outline" title={pt ? 'Desativar conta' : 'Deactivate Account'} danger onPress={() => setConfirming(true)} />
      </SettingsSection>
      <Text style={styles.note}>{pt ? 'A desativação da conta tem efeito imediato.' : 'Account deactivation takes effect immediately.'}</Text>
      <ActionSheet visible={confirming} title={pt ? 'Desativar a sua conta?' : 'Deactivate your account?'} subtitle={pt ? 'A sua sessão será terminada e perderá o acesso ao Koino.' : 'You will be signed out and lose access to Koino.'} cancelLabel={pt ? 'Cancelar' : 'Cancel'} onClose={() => setConfirming(false)} actions={[{ key: 'deactivate', label: busy ? (pt ? 'A desativar…' : 'Deactivating…') : (pt ? 'Desativar conta' : 'Deactivate account'), icon: 'trash-outline', destructive: true, disabled: busy, onPress: confirmDeactivate }]} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </SettingsScreen>
  );
}
const styles = StyleSheet.create({ note: { color: '#8a919a', fontSize: 10, textAlign: 'center' } });
