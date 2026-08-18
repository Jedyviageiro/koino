import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { clearAuthSession } from '@/features/auth/authStorage';
import { deactivateAccount, getSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';

export default function AccountSettingsScreen() {
  const [user, setUser] = useState<UserSettings | null>(null);
  useEffect(() => { getSettings().then(setUser).catch(() => {}); }, []);
  function confirmDeactivate() {
    Alert.alert('Deactivate your account?', 'You will be signed out and will no longer be able to access Koino.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => { await deactivateAccount(); await clearAuthSession(); router.replace('/'); } },
    ]);
  }
  return (
    <SettingsScreen title="Account Settings" subtitle="Manage your account details and security.">
      <SettingsSection title="Account Information">
        <SettingsRow icon="account-edit-outline" title="Edit Profile" subtitle="Update your personal information" onPress={() => router.push('/settings/edit-profile')} />
        <SettingsRow icon="at" title="Username" subtitle={user?.username ? `@${user.username}` : 'Loading...'} />
        <SettingsRow icon="email-outline" title="Email" subtitle={user?.email ?? 'Loading...'} />
        <SettingsRow icon="key-outline" title="Password" subtitle="Reset your password securely" onPress={() => router.push('/forgot-password')} />
        <SettingsRow icon="clock-outline" title="Time Zone" subtitle={user?.timeZone ?? 'Africa/Maputo'} onPress={() => router.push('/settings/edit-profile')} />
      </SettingsSection>
      <SettingsSection title="Account Actions">
        <SettingsRow icon="export-variant" title="Export My Data" danger onPress={() => Alert.alert('Export requested', 'Data export delivery is not available from the current backend yet.')} />
        <SettingsRow icon="delete-outline" title="Deactivate Account" danger onPress={confirmDeactivate} />
      </SettingsSection>
      <Text style={styles.note}>Account deactivation takes effect immediately.</Text>
    </SettingsScreen>
  );
}
const styles = StyleSheet.create({ note: { color: '#8a919a', fontSize: 10, textAlign: 'center' } });
