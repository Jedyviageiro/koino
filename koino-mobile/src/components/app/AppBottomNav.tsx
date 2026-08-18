import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'home' | 'plans' | 'bible' | 'community' | 'chat' | 'settings';
type IconName = keyof typeof Ionicons.glyphMap;

const items: { key: Tab; label: string; icon: IconName; activeIcon: IconName; path: '/home' | '/plans' | '/bible' | '/community' | '/chat/index' | '/settings/index' }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', path: '/home' },
  { key: 'plans', label: 'Plans', icon: 'reader-outline', activeIcon: 'reader', path: '/plans' },
  { key: 'bible', label: 'Bible', icon: 'book-outline', activeIcon: 'book', path: '/bible' },
  { key: 'community', label: 'Community', icon: 'people-outline', activeIcon: 'people', path: '/community' },
  { key: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', path: '/chat/index' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings', path: '/settings/index' },
];

export function AppBottomNav({ active }: { active: Tab }) {
  const insets = useSafeAreaInsets();
  const visibleItems = items;
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.nav}>
        {visibleItems.map((item) => {
          const selected = item.key === active;
          const selectedColor = item.key === 'chat' ? '#286af4' : '#e88f0c';
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => router.replace(item.path as Href)}
              style={({ pressed }) => [styles.item, selected && (item.key === 'chat' ? styles.itemChatActive : styles.itemActive), pressed && styles.pressed]}
            >
              <Ionicons
                name={selected ? item.activeIcon : item.icon}
                size={27}
                color={selected ? selectedColor : '#747c87'}
              />
              <Text style={[styles.label, selected && styles.labelActive, selected && item.key === 'chat' && styles.labelChatActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderTopWidth: 1, borderTopColor: '#eceef0', backgroundColor: '#fff' },
  nav: { minHeight: 70, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'stretch' },
  item: { flex: 1, minWidth: 0, paddingTop: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  itemActive: { backgroundColor: '#fff8ee' },
  itemChatActive: { backgroundColor: '#f1f5ff' },
  pressed: { opacity: 0.65 },
  label: { color: '#747c87', fontSize: 9, lineHeight: 13, fontWeight: '500' },
  labelActive: { color: '#d97f00', fontWeight: '700' },
  labelChatActive: { color: '#286af4' },
});
