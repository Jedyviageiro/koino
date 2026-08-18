import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getPasswordChecks } from '@/features/auth/passwordPolicy';

export function PasswordRules({ password }: { password: string }) {
  const checks = getPasswordChecks(password);
  const rules = [
    ['length', '8–72 characters'],
    ['uppercase', 'Uppercase'],
    ['lowercase', 'Lowercase'],
    ['number', 'Number'],
    ['symbol', 'Symbol'],
  ] as const;

  return (
    <View style={styles.grid}>
      {rules.map(([key, label]) => (
        <View key={key} style={styles.rule}>
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={checks[key] ? '#c58a28' : '#b6bbc3'}
          />
          <Text style={[styles.label, checks[key] && styles.valid]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 17 },
  rule: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#747b86', fontSize: 14 },
  valid: { color: '#293440' },
});
