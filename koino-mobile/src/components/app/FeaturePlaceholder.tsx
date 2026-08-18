import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppShell } from './AppShell';

type Tab = 'bible' | 'community';
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function FeaturePlaceholder({ active, title, icon }: { active: Tab; title: string; icon: IconName }) {
  return (
    <AppShell active={active}>
      <View style={styles.content}>
        <View style={styles.icon}><MaterialCommunityIcons name={icon} size={42} color="#d68108" /></View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>This section is ready for the next screen designs.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e6' },
  title: { marginTop: 21, color: '#141b22', fontFamily: 'serif', fontSize: 30, fontWeight: '700' },
  text: { marginTop: 9, color: '#737c88', fontSize: 14, textAlign: 'center' },
});
