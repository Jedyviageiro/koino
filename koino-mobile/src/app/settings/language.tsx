import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsScreen } from '@/components/settings/SettingsUI';
import { getSettings, updateSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';

const languages = [{ value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }];
export default function LanguageScreen() {
  const { language: appLanguage, setLanguage } = useLanguage();
  const [settings, setSettings] = useState<UserSettings | null>(null); const [status, setStatus] = useState('');
  useEffect(() => { getSettings().then(setSettings).catch((failure) => setStatus(failure instanceof Error ? failure.message : 'Unable to load language.')); }, []);
  async function select(value: string) { if (!settings) return; const next = value === 'pt' ? 'pt' : 'en'; if (next !== settings.language) setSettings(await updateSettings({ ...settings, language: next })); await setLanguage(next); setStatus(next === 'pt' ? 'Idioma guardado.' : 'Language saved.'); }
  return <SettingsScreen title={appLanguage === 'pt' ? 'Idioma' : 'Language'} subtitle={appLanguage === 'pt' ? 'Escolha o seu idioma preferido.' : 'Choose your preferred language.'}><View style={styles.card}>{languages.map((item) => <Pressable key={item.value} onPress={() => select(item.value).catch((failure) => setStatus(failure instanceof Error ? failure.message : appLanguage === 'pt' ? 'Não foi possível guardar.' : 'Unable to save language.'))} style={styles.row}><Text style={styles.label}>{item.label}</Text>{appLanguage === item.value ? <MaterialCommunityIcons name="check-circle" size={21} color="#ed9210" /> : null}</Pressable>)}</View>{status ? <Text style={styles.status}>{status}</Text> : null}</SettingsScreen>;
}
const styles = StyleSheet.create({ card: { overflow: 'hidden', borderWidth: 1, borderColor: '#e2e5e8', borderRadius: 9 }, row: { minHeight: 59, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7ea', flexDirection: 'row', alignItems: 'center' }, label: { flex: 1, color: '#17202a', fontSize: 12, fontWeight: '500' }, status: { color: '#a46812', fontSize: 10, textAlign: 'center' } });
