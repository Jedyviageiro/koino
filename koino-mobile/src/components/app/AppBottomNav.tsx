import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/LanguageProvider';

type Tab = 'home' | 'plans' | 'bible' | 'community' | 'chat' | 'settings';
type IconName = keyof typeof Ionicons.glyphMap;

const items: { key: Tab; label: string; icon: IconName; activeIcon: IconName; path: '/home' | '/plans' | '/bible' | '/community' | '/settings' }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', path: '/home' },
  { key: 'plans', label: 'Plans', icon: 'layers-outline', activeIcon: 'layers', path: '/plans' },
  { key: 'bible', label: 'Bible', icon: 'book-outline', activeIcon: 'book', path: '/bible' },
  { key: 'community', label: 'Community', icon: 'people-circle-outline', activeIcon: 'people-circle', path: '/community' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings', path: '/settings' },
];

export function AppBottomNav({ active }: { active: Tab }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const visibleItems = items;
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.nav}>
        {visibleItems.map((item) => {
          const selected = item.key === active;
          const selectedColor = '#e88f0c';
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => router.replace(item.path as Href)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Ionicons
                name={selected ? item.activeIcon : item.icon}
                size={24}
                color={selected ? selectedColor : '#747c87'}
              />
              <Text style={[styles.label, selected && styles.labelActive]}>{t(item.key)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderTopWidth: 1, borderTopColor: '#eceef0', backgroundColor: '#fff' },
  nav: { minHeight: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'stretch' },
  item: { flex: 1, minWidth: 0, paddingTop: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pressed: { opacity: 0.65 },
  label: { color: '#747c87', fontSize: 9, lineHeight: 13, fontWeight: '500' },
  labelActive: { color: '#d97f00', fontWeight: '700' },
});
