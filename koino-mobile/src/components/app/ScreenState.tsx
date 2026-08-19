import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useLanguage } from '@/features/localization/LanguageProvider';

export function LoadingState({ label }: { label?: string }) {
  const { language } = useLanguage();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e5951d" />
      <Text style={styles.message}>{label ?? (language === 'pt' ? 'A carregar a sua jornada Koino…' : 'Loading your Koino journey…')}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { language } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.icon}><MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#b46d11" /></View>
      <Text style={styles.title}>{language === 'pt' ? 'Ocorreu um erro' : 'Something went wrong'}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>{language === 'pt' ? 'Tentar novamente' : 'Try Again'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 34, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e7' },
  title: { marginTop: 17, color: '#151b22', fontSize: 20, fontWeight: '700' },
  message: { marginTop: 9, color: '#727b88', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { marginTop: 19, height: 44, paddingHorizontal: 24, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e99a24' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
