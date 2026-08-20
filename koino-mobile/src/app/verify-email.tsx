import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { confirmEmail, resendVerification } from '@/features/auth/authService';

type VerificationState = 'waiting' | 'verifying' | 'verified' | 'sending' | 'error';

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const token = first(params.token);
  const email = first(params.email);
  const attemptedToken = useRef('');
  const [state, setState] = useState<VerificationState>(token ? 'verifying' : 'waiting');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || attemptedToken.current === token) return;
    attemptedToken.current = token;
    setState('verifying');
    confirmEmail(token)
      .then((response) => {
        setState('verified');
        setMessage(response.message);
      })
      .catch((error: unknown) => {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'This verification link is invalid or expired.');
      });
  }, [token]);

  async function resend() {
    if (!email || state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      const response = await resendVerification(email);
      setState('waiting');
      setMessage(response.message);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to resend the email.');
    }
  }

  const verified = state === 'verified';
  const busy = state === 'verifying' || state === 'sending';

  return (
    <AuthScreen
      title={verified ? 'Email confirmed' : state === 'error' ? 'Link problem' : 'Confirm your email'}
      subtitle={verified
        ? 'Your account is ready. You can now log in.'
        : email
          ? `We sent a secure verification link to\n${email}`
          : 'Open the secure link in your email to activate your account.'}
      onBack={() => router.replace('/')}
    >
      <View style={[styles.icon, verified && styles.verifiedIcon]}>
        {busy ? (
          <ActivityIndicator color="#c58522" size="large" />
        ) : (
          <MaterialCommunityIcons
            name={verified ? 'check-circle-outline' : state === 'error' ? 'link-variant' : 'email-check-outline'}
            size={42}
            color={verified ? '#28784d' : '#c58522'}
          />
        )}
      </View>
      <Text style={[styles.message, verified && styles.success]}>
        {message || (busy ? 'Verifying your email…' : 'The link expires after 24 hours.')}
      </Text>
      <AuthButton
        label={verified ? 'Continue to Login' : 'Back to Login'}
        disabled={busy}
        onPress={() => router.replace('/')}
      />
      {!verified && email ? (
        <Text onPress={resend} style={[styles.resend, busy && styles.disabled]}>
          {state === 'sending' ? 'Sending…' : 'Resend verification email'}
        </Text>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: '#fff6e8' },
  verifiedIcon: { backgroundColor: '#eef8f2' },
  message: { minHeight: 82, paddingTop: 18, color: '#68717d', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  success: { color: '#28784d' },
  resend: { marginTop: 24, color: '#bd7d18', textAlign: 'center', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
