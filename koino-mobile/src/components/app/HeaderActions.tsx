import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export function HeaderActions({ unread = false }: { unread?: boolean }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Search" onPress={() => router.push('/bible')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="magnify" size={29} color="#121820" />
      </Pressable>
      <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="bell-outline" size={27} color="#121820" />
        {unread ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  button: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: '#eceef0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  pressed: { opacity: 0.65 },
  badge: { position: 'absolute', right: 8, top: 7, width: 9, height: 9, borderRadius: 5, backgroundColor: '#ed8e16', borderWidth: 2, borderColor: '#fff' },
});
