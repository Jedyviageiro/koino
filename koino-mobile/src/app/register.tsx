import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PasswordRules } from '@/components/auth/PasswordRules';
import { emailExists, register } from '@/features/auth/authService';
import { isStrongPassword } from '@/features/auth/passwordPolicy';

export default function RegisterScreen() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordsMatch = password === confirmation;
  const canSubmit =
    fullname.trim().length >= 2 &&
    emailValid &&
    isStrongPassword(password) &&
    passwordsMatch;

  async function handleRegister() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const availability = await emailExists(email);
      if (availability.exists) {
        setMessage('This email is already in use.');
        return;
      }
      const result = await register(fullname, email, password);
      if (result.verificationRequired) {
        router.replace({ pathname: '/verify-email', params: { email: result.email } });
      } else {
        Alert.alert('Account created', 'Your Koino account is ready.', [
          { text: 'Continue to login', onPress: () => router.replace('/') },
        ]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Start your journey of faith with Koino."
      onBack={() => router.back()}
    >
      <View style={styles.fields}>
        <AuthField
          icon="account-outline"
          placeholder="Full name"
          value={fullname}
          onChangeText={setFullname}
          autoCapitalize="words"
          autoComplete="name"
          editable={!loading}
        />
        <AuthField
          icon="email-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!loading}
        />
        <AuthField
          icon="lock-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!loading}
          password
        />
        <AuthField
          icon="lock-outline"
          placeholder="Confirm password"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="none"
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          editable={!loading}
          password
        />
      </View>

      <PasswordRules password={password} />
      <Text style={styles.message}>
        {confirmation && !passwordsMatch ? 'Passwords do not match.' : message}
      </Text>
      <AuthButton
        label="Create Account"
        loading={loading}
        disabled={!canSubmit}
        onPress={handleRegister}
      />

      <View style={styles.accountRow}>
        <Text style={styles.accountText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.goldLink}>Sign In</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 10 },
  message: { minHeight: 34, paddingTop: 8, color: '#b83434', textAlign: 'center', fontSize: 13 },
  accountRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  accountText: { color: '#747b86', fontSize: 14 },
  goldLink: { color: '#bd7d18', fontSize: 14, fontWeight: '600' },
});
