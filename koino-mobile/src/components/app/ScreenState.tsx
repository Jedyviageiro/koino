import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function LoadingState({ label = 'Loading your Koino journey…' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e5951d" />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#b46d11" /></View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Try Again</Text></Pressable>
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
