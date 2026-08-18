import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';
import { getLocalPreferences, saveLocalPreferences } from '@/features/settings/settingsService';
import type { LocalPreferences } from '@/features/settings/types';

type ToggleKey = keyof Pick<LocalPreferences, 'pushMessages' | 'pushMentions' | 'planReminders' | 'communityActivity' | 'newFollowers' | 'emailNotifications' | 'weeklySummary'>;

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<LocalPreferences | null>(null);
  useEffect(() => { getLocalPreferences().then(setPrefs); }, []);
  async function toggle(key: ToggleKey) { if (!prefs) return; const next = { ...prefs, [key]: !prefs[key] }; setPrefs(next); await saveLocalPreferences(next); }
  return <SettingsScreen title="Notifications" subtitle="Choose what you want to be notified about.">
    <Text style={styles.heading}>Push Notifications</Text>
    <SettingsSection title="This device">
      <Toggle title="Messages" subtitle="New messages from friends" value={prefs?.pushMessages ?? true} onChange={() => toggle('pushMessages')} />
      <Toggle title="Mentions" subtitle="When someone mentions you" value={prefs?.pushMentions ?? true} onChange={() => toggle('pushMentions')} />
      <Toggle title="Plan Reminders" subtitle="Daily plan reminders" value={prefs?.planReminders ?? true} onChange={() => toggle('planReminders')} />
      <Toggle title="Community Activity" subtitle="Comments on your posts" value={prefs?.communityActivity ?? false} onChange={() => toggle('communityActivity')} />
      <Toggle title="New Followers" subtitle="When someone follows you" value={prefs?.newFollowers ?? true} onChange={() => toggle('newFollowers')} />
    </SettingsSection>
    <Text style={styles.heading}>Email Notifications</Text>
    <SettingsSection>
      <Toggle title="Email Notifications" value={prefs?.emailNotifications ?? true} onChange={() => toggle('emailNotifications')} />
      <Toggle title="Weekly Summary" subtitle="Your weekly activity summary" value={prefs?.weeklySummary ?? true} onChange={() => toggle('weeklySummary')} />
    </SettingsSection>
  </SettingsScreen>;
}

function Toggle({ title, subtitle, value, onChange }: { title: string; subtitle?: string; value: boolean; onChange: () => void }) {
  return <View style={styles.row}><View style={styles.copy}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><Switch value={value} onValueChange={onChange} trackColor={{ false: '#dfe3e8', true: '#f2a22c' }} thumbColor="#fff" /></View>;
}
const styles = StyleSheet.create({ heading: { color: '#17202a', fontSize: 11, fontWeight: '700' }, row: { minHeight: 61, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7ea', flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1 }, title: { color: '#17202a', fontSize: 12, fontWeight: '600' }, subtitle: { marginTop: 3, color: '#7b8492', fontSize: 9 } });
