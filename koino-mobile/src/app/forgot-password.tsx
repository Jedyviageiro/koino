import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { requestPasswordReset } from '@/features/auth/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await requestPasswordReset(email);
      setSent(true);
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send the reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title={sent ? 'Check your email' : 'Forgot password?'}
      subtitle={sent
        ? `We sent password reset instructions to\n${email.trim()}`
        : 'Enter your email and we’ll send you\na secure password reset link.'}
      onBack={() => router.back()}
    >
      {sent ? (
        <View style={styles.noticeIcon}>
          <MaterialCommunityIcons name="email-check-outline" size={38} color="#c58522" />
        </View>
      ) : (
        <AuthField
          icon="email-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
          editable={!loading}
        />
      )}

      <Text style={[styles.message, sent && styles.success]}>{message}</Text>
      <AuthButton
        label={sent ? 'Resend Email' : 'Send Reset Link'}
        loading={loading}
        disabled={!valid}
        onPress={submit}
      />
      <Text onPress={() => router.replace('/')} style={styles.backLink}>
        Back to login
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  noticeIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff6e8',
  },
  message: { minHeight: 58, paddingTop: 14, color: '#b83434', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  success: { color: '#68717d' },
  backLink: { marginTop: 24, textAlign: 'center', color: '#bd7d18', fontSize: 14, fontWeight: '600' },
});
