import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { Toast, type ToastMessage } from '@/components/app/Toast';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { useState } from 'react';

const WEBSITE = 'https://koinoo.space';

export default function AboutScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  async function openWebsite() {
    try { await Linking.openURL(WEBSITE); }
    catch { setToast({ id: Date.now(), tone: 'error', text: pt ? 'Não foi possível abrir o site.' : 'Unable to open the website.' }); }
  }
  return <SettingsScreen title={pt ? 'Sobre o Koino' : 'About Koino'} subtitle={pt ? 'Uma comunidade criada para crescer na fé.' : 'A community built to grow in faith.'}>
    <View style={styles.hero}><View style={styles.mark}><MaterialCommunityIcons name="book-cross" size={34} color="#dd8306" /></View><Text style={styles.name}>Koino</Text><Text style={styles.version}>{pt ? 'Versão' : 'Version'} {version}</Text></View>
    <View style={styles.mission}><Text style={styles.missionTitle}>{pt ? 'A nossa missão' : 'Our mission'}</Text><Text style={styles.missionText}>{pt ? 'Ajudar pessoas a ler a Bíblia com consistência, crescer em comunidade e aplicar a Palavra no dia a dia.' : 'Help people read Scripture consistently, grow in community, and apply the Word in everyday life.'}</Text></View>
    <SettingsSection title={pt ? 'Aplicação' : 'Application'}>
      <SettingsRow icon="cellphone" title={pt ? 'Aplicação móvel' : 'Mobile application'} subtitle={`Koino ${version} · Expo SDK 54`} />
      <SettingsRow icon="web" title={pt ? 'Site oficial' : 'Official website'} subtitle="koinoo.space" onPress={openWebsite} />
    </SettingsSection>
    <Text style={styles.footer}>© {new Date().getFullYear()} Koino</Text>
    <Toast message={toast} onDismiss={() => setToast(null)} />
  </SettingsScreen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 8 }, mark: { width: 70, height: 70, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff4e4' }, name: { marginTop: 12, color: '#141c24', fontSize: 25, fontWeight: '800' }, version: { marginTop: 3, color: '#7a8491', fontSize: 12 },
  mission: { padding: 17, borderWidth: 1, borderColor: '#e4e7ea', borderRadius: 14, backgroundColor: '#fff' }, missionTitle: { color: '#17202a', fontSize: 15, fontWeight: '700' }, missionText: { marginTop: 8, color: '#667180', fontSize: 13, lineHeight: 21 }, footer: { color: '#8a929c', fontSize: 11, textAlign: 'center' },
});
