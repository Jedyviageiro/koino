import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { SettingsScreen } from '@/components/settings/SettingsUI';
import { getSettings, updateSettings } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { Toast, type ToastMessage } from '@/components/app/Toast';

const languages = [{ value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }];
export default function LanguageScreen() {
  const { language: appLanguage, setLanguage } = useLanguage();
  const [settings, setSettings] = useState<UserSettings | null>(null); const [toast, setToast] = useState<ToastMessage | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { getSettings().then(setSettings).catch((failure) => setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : appLanguage === 'pt' ? 'Não foi possível carregar o idioma.' : 'Unable to load language.' })); }, [appLanguage]);
  async function select(value: string) { if (!settings || saving) return; const next = value === 'pt' ? 'pt' : 'en'; setSaving(true); try { if (next !== settings.language) setSettings(await updateSettings({ ...settings, language: next })); await setLanguage(next); setToast({ id: Date.now(), tone: 'success', text: next === 'pt' ? 'Idioma guardado.' : 'Language saved.' }); } finally { setSaving(false); } }
  return <SettingsScreen title={appLanguage === 'pt' ? 'Idioma' : 'Language'} subtitle={appLanguage === 'pt' ? 'Escolha o seu idioma preferido.' : 'Choose your preferred language.'}><View style={styles.card}>{languages.map((item) => <Pressable key={item.value} disabled={saving} onPress={() => select(item.value).catch((failure) => setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : appLanguage === 'pt' ? 'Não foi possível guardar.' : 'Unable to save language.' }))} style={[styles.row, saving && styles.disabled]}><Text style={styles.label}>{item.label}</Text>{appLanguage === item.value ? <MaterialCommunityIcons name="check-circle" size={21} color="#ed9210" /> : null}</Pressable>)}</View><Toast message={toast} onDismiss={() => setToast(null)} /></SettingsScreen>;
}
const styles = StyleSheet.create({ card: { overflow: 'hidden', borderWidth: 1, borderColor: '#e2e5e8', borderRadius: 12 }, row: { minHeight: 64, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7ea', flexDirection: 'row', alignItems: 'center' }, label: { flex: 1, color: '#17202a', fontSize: 14, fontWeight: '600' }, disabled: { opacity: 0.5 } });
