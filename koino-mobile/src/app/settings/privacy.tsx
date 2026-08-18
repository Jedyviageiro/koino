import { useState } from 'react';
import { Switch } from 'react-native';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/components/settings/SettingsUI';

export default function PrivacyScreen() {
  const [twoFactor, setTwoFactor] = useState(false);
  return <SettingsScreen title="Privacy & Safety" subtitle="Manage your privacy and keep your account safe.">
    <SettingsSection title="Privacy"><SettingsRow icon="message-lock-outline" title="Who can message me" subtitle="Friends" onPress={() => {}} /><SettingsRow icon="eye-outline" title="Profile Visibility" subtitle="Anyone with the link" onPress={() => {}} /><SettingsRow icon="account-cancel-outline" title="Blocked Users" onPress={() => {}} /></SettingsSection>
    <SettingsSection title="Safety"><SettingsRow icon="lock-check-outline" title="Two-Factor Authentication" subtitle={twoFactor ? 'On' : 'Off'} right={<Switch value={twoFactor} onValueChange={setTwoFactor} trackColor={{ false: '#dfe3e8', true: '#f2a22c' }} />} /><SettingsRow icon="chart-timeline-variant" title="Login Activity" onPress={() => {}} /></SettingsSection>
  </SettingsScreen>;
}
