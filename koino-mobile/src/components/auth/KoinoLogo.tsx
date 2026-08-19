import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

export function KoinoLogo() {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="Koino"
        contentFit="contain"
        source={require('../../../assets/images/koino-logo.svg')}
        style={styles.mark}
      />
      <Text style={styles.wordmark}>Koino</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 5 },
  mark: { width: 52, height: 52 },
  wordmark: { color: '#101822', fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
});
