import { Ionicons } from '@expo/vector-icons';
import { NetworkStateType, useNetworkState } from 'expo-network';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText as Text } from '@/components/app/Typography';
import { useLanguage } from '@/features/localization/LanguageProvider';

export function ConnectivityNotice() {
  const network = useNetworkState();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const initialized = network.type !== undefined && network.type !== NetworkStateType.UNKNOWN;
  const offline = network.type === NetworkStateType.NONE || (initialized && (network.isConnected === false || network.isInternetReachable === false));

  if (!offline) return null;

  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, { top: Math.max(insets.top, 10) + 8 }]}>
      <Ionicons name="cloud-offline-outline" size={20} color="#fff" />
      <Text style={styles.text}>
        {language === 'pt'
          ? 'Parece que está sem ligação. Verifique a internet para continuar.'
          : 'You appear to be offline. Check your connection to continue.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { position: 'absolute', zIndex: 1100, elevation: 22, left: 16, right: 16, minHeight: 50, paddingHorizontal: 14, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#303944' },
  text: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
