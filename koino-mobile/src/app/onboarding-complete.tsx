import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/AuthButton';
import { KoinoLogo } from '@/components/auth/KoinoLogo';

export default function OnboardingCompleteScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <KoinoLogo />
      <View style={styles.center}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="book-check-outline" size={48} color="#c6811d" />
        </View>
        <Text style={styles.eyebrow}>YOUR JOURNEY IS READY</Text>
        <Text style={styles.title}>Your reading plan has been prepared.</Text>
        <Text style={styles.subtitle}>
          Koino will use your answers to shape a daily rhythm that fits your life.
        </Text>
      </View>
      <AuthButton label="Continue" onPress={() => router.replace('/home')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 28, paddingTop: 38, paddingBottom: 30, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  icon: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6e8' },
  eyebrow: { marginTop: 28, color: '#858c96', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  title: { marginTop: 12, maxWidth: 330, color: '#101820', fontFamily: 'Poppins_700Bold', fontSize: 30, lineHeight: 38, textAlign: 'center' },
  subtitle: { marginTop: 14, maxWidth: 320, color: '#747b86', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  note: { marginTop: 13, color: '#969ca5', fontSize: 11, textAlign: 'center' },
});
