import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '@/theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;
export type SheetAction = { key: string; label: string; icon: IconName; onPress: () => void; destructive?: boolean; disabled?: boolean };

export function ActionSheet({ visible, title, subtitle, actions, cancelLabel, onClose }: { visible: boolean; title: string; subtitle?: string; actions: SheetAction[]; cancelLabel: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <Pressable accessibilityRole="button" accessibilityLabel={cancelLabel} onPress={onClose} style={styles.backdrop}>
      <Pressable accessibilityRole="none" onPress={(event) => event.stopPropagation()} style={[styles.sheet, { paddingBottom: Math.max(14, insets.bottom) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={3} style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.actions}>{actions.map((action) => <Pressable key={action.key} disabled={action.disabled} onPress={() => { onClose(); action.onPress(); }} style={({ pressed }) => [styles.action, pressed && styles.pressed, action.disabled && styles.disabled]}>
          <View style={[styles.icon, action.destructive && styles.dangerIcon]}><Ionicons name={action.icon} size={21} color={action.destructive ? '#b43e36' : '#9a5b00'} /></View>
          <Text style={[styles.actionLabel, action.destructive && styles.danger]}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#8a929d" />
        </Pressable>)}</View>
        <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{cancelLabel}</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13,19,27,.42)' },
  sheet: { paddingHorizontal: 16, paddingTop: 10, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#fff' },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#d8dce1' },
  title: { marginTop: 16, color: '#151c24', fontFamily: typography.semibold, fontSize: 20, textAlign: 'center' },
  subtitle: { marginTop: 5, color: '#737d8a', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actions: { marginTop: 17, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7ea', borderRadius: 16 },
  action: { minHeight: 62, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7e9ec', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3df' },
  dangerIcon: { backgroundColor: '#fff0ee' }, actionLabel: { flex: 1, color: '#202832', fontFamily: typography.medium, fontSize: 14 }, danger: { color: '#a83b35' },
  cancel: { height: 50, marginTop: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f5f6' }, cancelText: { color: '#303944', fontFamily: typography.semibold, fontSize: 14 },
  pressed: { backgroundColor: '#faf7f2' }, disabled: { opacity: .42 },
});
