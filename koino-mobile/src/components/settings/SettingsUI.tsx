import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function SettingsScreen({ title, subtitle, back = true, children }: PropsWithChildren<{ title: string; subtitle?: string; back?: boolean }>) {
  return (
    <AppShell active="settings">
      <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {back ? <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={24} color="#586477" /></Pressable> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </AppShell>
  );
}

export function SettingsSection({ title, children }: PropsWithChildren<{ title?: string }>) {
  return <View style={styles.section}>{title ? <Text style={styles.sectionTitle}>{title}</Text> : null}<View style={styles.card}>{children}</View></View>;
}

export function SettingsRow({ icon, title, subtitle, onPress, danger = false, right }: { icon: IconName; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: ReactNode }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={icon} size={20} color={danger ? '#e24545' : '#617086'} />
      <View style={styles.rowCopy}><Text style={[styles.rowTitle, danger && styles.danger]}>{title}</Text>{subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}</View>
      {right ?? (onPress ? <MaterialCommunityIcons name="chevron-right" size={21} color="#697587" /> : null)}
    </Pressable>
  );
}

export const settingsStyles = StyleSheet.create({
  fieldLabel: { marginBottom: 7, color: '#18212a', fontSize: 12, fontWeight: '600' },
  field: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderColor: '#dfe3e8', borderRadius: 8, color: '#19222c', fontSize: 13, backgroundColor: '#fff' },
  fieldGroup: { marginBottom: 16 }, helper: { marginTop: 5, color: '#7b8491', fontSize: 10 },
  primary: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed9210' }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  status: { marginTop: 12, padding: 10, borderRadius: 8, color: '#94402f', backgroundColor: '#fff3ef', fontSize: 11, textAlign: 'center' },
});

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }, back: { width: 40, height: 35, justifyContent: 'center' },
  title: { color: '#111820', fontFamily: 'serif', fontSize: 31, lineHeight: 38, fontWeight: '700' }, subtitle: { marginTop: 4, color: '#697487', fontSize: 12, lineHeight: 18 }, content: { marginTop: 25, gap: 18 },
  section: { gap: 8 }, sectionTitle: { color: '#1b232c', fontSize: 11, fontWeight: '700' }, card: { overflow: 'hidden', borderWidth: 1, borderColor: '#e2e5e8', borderRadius: 10, backgroundColor: '#fff' },
  row: { minHeight: 61, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7ea', flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed: { backgroundColor: '#faf8f4' },
  rowCopy: { flex: 1 }, rowTitle: { color: '#17202a', fontSize: 12, fontWeight: '600' }, rowSubtitle: { marginTop: 3, color: '#788291', fontSize: 9, lineHeight: 13 }, danger: { color: '#de3d3d' },
});
