import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PasswordRules } from '@/components/auth/PasswordRules';
import { resetPassword } from '@/features/auth/authService';
import { isStrongPassword } from '@/features/auth/passwordPolicy';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const matches = password === confirmation && confirmation.length > 0;
  const canSubmit = Boolean(token) && isStrongPassword(password) && matches;

  async function submit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setMessage('');
    try {
      await resetPassword(token, password, confirmation);
      setComplete(true);
      setMessage('Your password was updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title={complete ? 'Password updated' : 'Create new password'}
      subtitle={complete
        ? 'You can now use your new password to log in.'
        : 'Choose a strong password you haven’t used before.'}
      onBack={() => router.replace('/')}
    >
      {!complete ? (
        <>
          <View style={styles.fields}>
            <AuthField
              icon="lock-outline"
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!loading}
              password
            />
            <AuthField
              icon="lock-check-outline"
              placeholder="Confirm new password"
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={submit}
              editable={!loading}
              password
            />
          </View>
          <PasswordRules password={password} />
        </>
      ) : null}

      <Text style={[styles.message, complete && styles.success]}>
        {!token ? 'This reset link is missing or invalid. Request a new one.' :
          confirmation && !matches ? 'Passwords do not match.' : message}
      </Text>
      <AuthButton
        label={complete ? 'Continue to Login' : 'Update Password'}
        loading={loading}
        disabled={!complete && !canSubmit}
        onPress={complete ? () => router.replace('/') : submit}
      />
      {!token ? (
        <Text onPress={() => router.replace('/forgot-password')} style={styles.link}>
          Request a new link
        </Text>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 10 },
  message: { minHeight: 56, paddingTop: 12, color: '#b83434', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  success: { color: '#28784d' },
  link: { marginTop: 22, color: '#bd7d18', textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
