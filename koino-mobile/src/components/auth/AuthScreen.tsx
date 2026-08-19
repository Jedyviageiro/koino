import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { KoinoLogo } from './KoinoLogo';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  onBack?: () => void;
}>;

export function AuthScreen({ title, subtitle, onBack, children }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={onBack}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={36} color="#121b25" />
              </Pressable>
            ) : null}
            <KoinoLogo />
            <View style={styles.heading}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {children}
          </View>
          <View style={styles.waves} pointerEvents="none">
            <View style={[styles.wave, styles.waveOne]} />
            <View style={[styles.wave, styles.waveTwo]} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, minHeight: 720 },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 36,
    zIndex: 2,
  },
  backButton: { position: 'absolute', left: 20, top: 8, zIndex: 3 },
  heading: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  title: {
    color: '#0d1722',
    fontSize: 31,
    lineHeight: 39,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#707782',
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: 13,
    paddingHorizontal: 8,
  },
  waves: { height: 110, overflow: 'hidden', marginTop: 'auto' },
  wave: { position: 'absolute', width: '135%', height: 210, borderRadius: 200, left: '-18%' },
  waveOne: { top: 35, backgroundColor: '#fbf7ef', transform: [{ rotate: '9deg' }] },
  waveTwo: { top: 74, backgroundColor: '#f8f1e5', transform: [{ rotate: '-7deg' }] },
});
