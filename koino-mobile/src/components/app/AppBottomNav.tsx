import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'home' | 'plans' | 'bible' | 'watch' | 'community' | 'chat';
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const items: { key: Tab; label: string; icon: IconName; activeIcon: IconName; path: '/home' | '/plans' | '/bible' | '/watch' | '/community' }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', path: '/home' },
  { key: 'plans', label: 'Plans', icon: 'book-open-page-variant-outline', activeIcon: 'book-open-page-variant', path: '/plans' },
  { key: 'bible', label: 'Bible', icon: 'book-open-variant', activeIcon: 'book-open-variant', path: '/bible' },
  { key: 'watch', label: 'Watch', icon: 'play-circle-outline', activeIcon: 'play-circle', path: '/watch' },
  { key: 'community', label: 'Community', icon: 'account-group-outline', activeIcon: 'account-group', path: '/community' },
];

export function AppBottomNav({ active }: { active: Tab }) {
  const insets = useSafeAreaInsets();
  const visibleItems = active === 'chat'
    ? [...items.slice(0, 4), { key: 'chat' as const, label: 'Chat', icon: 'message-outline' as const, activeIcon: 'message' as const, path: '/chat/index' as const }]
    : items;
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
              onPress={() => router.replace(item.path)}
              style={({ pressed }) => [styles.item, selected && (item.key === 'chat' ? styles.itemChatActive : styles.itemActive), pressed && styles.pressed]}
            >
              <MaterialCommunityIcons
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
  nav: { minHeight: 70, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'stretch' },
  item: { flex: 1, minWidth: 0, paddingTop: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 },
  itemActive: { backgroundColor: '#fff8ee' },
  itemChatActive: { backgroundColor: '#f1f5ff' },
  pressed: { opacity: 0.65 },
  label: { color: '#747c87', fontSize: 11, lineHeight: 15, fontWeight: '500' },
  labelActive: { color: '#d97f00', fontWeight: '700' },
  labelChatActive: { color: '#286af4' },
});
