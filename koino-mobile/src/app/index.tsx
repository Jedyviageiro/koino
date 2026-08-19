import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { getGoogleConfig, login, loginWithGoogle } from '@/features/auth/authService';
import { getAuthSession } from '@/features/auth/authStorage';

export default function IndexScreen() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 6;

  useEffect(() => {
    let active = true;
    getAuthSession()
      .then((session) => {
        if (active && session?.token) {
          router.replace(session.onboardingCompleted ? '/home' : '/onboarding');
        }
      })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const session = await login(email, password);
      router.replace(session.onboardingCompleted ? '/home' : '/onboarding');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (loading) return;
    if (Constants.appOwnership === 'expo') {
      setMessage('Google sign-in requires the Koino development build and cannot run inside Expo Go.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const [{ GoogleSignin, isSuccessResponse }, config] = await Promise.all([
        import('@react-native-google-signin/google-signin'),
        getGoogleConfig(),
      ]);
      if (!config.clientId) throw new Error('Google sign-in is not configured on the server.');

      GoogleSignin.configure({ webClientId: config.clientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;
      if (!response.data.idToken) throw new Error('Google did not return an identity token.');

      const session = await loginWithGoogle(response.data.idToken);
      router.replace(session.onboardingCompleted ? '/home' : '/onboarding');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return <View style={styles.sessionLoading}><ActivityIndicator size="large" color="#c58a28" /></View>;
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle={'Log in to your account and continue\nyour journey of faith.'}
    >
      <View style={styles.fields}>
        <AuthField
          icon="email-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          editable={!loading}
        />
        <AuthField
          icon="lock-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          editable={!loading}
          password
        />
      </View>

      <Pressable
        onPress={() => router.push('/forgot-password')}
        style={styles.forgotButton}
      >
        <Text style={styles.goldLink}>Forgot password?</Text>
      </Pressable>

      <Text style={[styles.message, message.startsWith('Welcome') && styles.success]}>{message}</Text>
      <AuthButton label="Log In" loading={loading} disabled={!canSubmit} onPress={handleLogin} />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        style={[styles.googleButton, loading && styles.googleButtonDisabled]}
        onPress={handleGoogleLogin}
      >
        <GoogleLogo />
        <Text style={styles.googleLabel}>Continue with Google</Text>
      </Pressable>

      <View style={styles.accountRow}>
        <Text style={styles.accountText}>Don’t have an account? </Text>
        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.goldLink}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sessionLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  fields: { gap: 14 },
  forgotButton: { alignSelf: 'flex-end', paddingVertical: 12 },
  goldLink: { color: '#bd7d18', fontSize: 14, fontWeight: '600' },
  message: { minHeight: 30, color: '#b83434', textAlign: 'center', fontSize: 13 },
  success: { color: '#28784d' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 20, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: '#dfe2e6' },
  or: { color: '#17212d', fontWeight: '600' },
  googleButton: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d9dde2',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#fff',
  },
  googleButtonDisabled: { opacity: 0.55 },
  googleLabel: { color: '#17212d', fontSize: 16, fontWeight: '500' },
  accountRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  accountText: { color: '#747b86', fontSize: 14 },
});
