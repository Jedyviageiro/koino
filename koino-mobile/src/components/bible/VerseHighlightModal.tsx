import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HIGHLIGHT_COLORS = ['#FFF1A8', '#FFD0C7', '#FFD6A1', '#CDECCF', '#BFE7E1', '#CFE0FF', '#DDD4FF', '#F5CFE1'];

export function VerseHighlightModal({ visible, reference, currentColor, language, saving, onSave, onRemove, onClose }: { visible: boolean; reference: string; currentColor: string | null; language: string; saving: boolean; onSave: (color: string) => void; onRemove: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const pt = language === 'pt';
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent><Pressable onPress={onClose} style={styles.backdrop}><Pressable onPress={(event) => event.stopPropagation()} style={[styles.sheet, { paddingBottom: Math.max(14, insets.bottom) }]}>
    <View style={styles.handle} />
    <View style={styles.icon}><Ionicons name="color-fill-outline" size={24} color="#d47c00" /></View>
    <Text style={styles.title}>{pt ? 'Destacar versículo' : 'Highlight verse'}</Text><Text style={styles.reference}>{reference}</Text>
    <View style={styles.colors}>{HIGHLIGHT_COLORS.map((color) => <Pressable key={color} disabled={saving} accessibilityLabel={pt ? 'Escolher cor de destaque' : 'Choose highlight color'} onPress={() => onSave(color)} style={[styles.colorButton, currentColor === color && styles.colorSelected]}><View style={[styles.swatch, { backgroundColor: color }]} /></Pressable>)}</View>
    {saving ? <ActivityIndicator color="#e78c08" /> : null}
    {currentColor ? <Pressable disabled={saving} onPress={onRemove} style={styles.remove}><Ionicons name="trash-outline" size={18} color="#b23e36" /><Text style={styles.removeText}>{pt ? 'Remover destaque' : 'Remove highlight'}</Text></Pressable> : null}
    <Pressable disabled={saving} onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{pt ? 'Cancelar' : 'Cancel'}</Text></Pressable>
  </Pressable></Pressable></Modal>;
}
const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13,19,27,.42)' }, sheet: { paddingHorizontal: 18, paddingTop: 10, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#fff' }, handle: { width: 38, height: 4, marginBottom: 16, borderRadius: 2, alignSelf: 'center', backgroundColor: '#d8dce1' }, icon: { width: 46, height: 46, borderRadius: 15, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e7' }, title: { marginTop: 12, color: '#17202a', fontFamily: 'Poppins_600SemiBold', fontSize: 19, textAlign: 'center' }, reference: { marginTop: 4, color: '#77818e', fontSize: 12, textAlign: 'center' }, colors: { marginVertical: 22, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11 }, colorButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8f9' }, colorSelected: { borderWidth: 2, borderColor: '#e48a06' }, swatch: { width: 34, height: 34, borderWidth: 1, borderColor: 'rgba(0,0,0,.05)', borderRadius: 10 }, remove: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff1ef' }, removeText: { color: '#a53b34', fontSize: 13, fontWeight: '700' }, cancel: { height: 48, marginTop: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f5f6' }, cancelText: { color: '#5f6977', fontSize: 13, fontWeight: '600' } });
