import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsScreen } from '@/components/settings/SettingsUI';
import { getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import { getSettings, updateSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';

const languages = [{ value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }];
export default function LanguageScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null); const [status, setStatus] = useState('');
  useEffect(() => { getSettings().then(setSettings).catch((failure) => setStatus(failure instanceof Error ? failure.message : 'Unable to load language.')); }, []);
  async function select(language: string) { if (!settings || language === settings.language) return; const updated = await updateSettings({ ...settings, language }); setSettings(updated); const session = await getAuthSession(); if (session) await saveAuthSession({ ...session, language }); setStatus('Language preference saved.'); }
  return <SettingsScreen title="Language" subtitle="Choose your preferred language."><View style={styles.card}>{languages.map((language) => <Pressable key={language.value} onPress={() => select(language.value).catch((failure) => setStatus(failure instanceof Error ? failure.message : 'Unable to save language.'))} style={styles.row}><Text style={styles.label}>{language.label}</Text>{settings?.language === language.value ? <MaterialCommunityIcons name="check-circle" size={21} color="#ed9210" /> : null}</Pressable>)}</View>{status ? <Text style={styles.status}>{status}</Text> : null}</SettingsScreen>;
}
const styles = StyleSheet.create({ card: { overflow: 'hidden', borderWidth: 1, borderColor: '#e2e5e8', borderRadius: 9 }, row: { minHeight: 59, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7ea', flexDirection: 'row', alignItems: 'center' }, label: { flex: 1, color: '#17202a', fontSize: 12, fontWeight: '500' }, status: { color: '#a46812', fontSize: 10, textAlign: 'center' } });
