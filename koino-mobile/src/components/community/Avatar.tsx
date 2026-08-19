import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

export function Avatar({ name, uri, size = 48 }: { name: string; uri?: string | null; size?: number }) {
  const initials = (name || 'Koino Reader').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={150} />;
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.max(11, size * 0.3) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#c91c5b' },
  initials: { color: '#fff', fontWeight: '700' },
});
