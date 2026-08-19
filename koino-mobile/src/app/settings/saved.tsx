import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { SettingsScreen } from '@/components/settings/SettingsUI';
import { LoadingState } from '@/components/app/ScreenState';
import { Toast, type ToastMessage } from '@/components/app/Toast';
import { getBookmarks, removeBookmark } from '@/features/app/appService';
import type { Bookmark } from '@/features/app/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleBook } from '@/features/localization/bibleBooks';

export default function SavedVersesScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [items, setItems] = useState<Bookmark[] | null>(null); const [busyId, setBusyId] = useState<number | null>(null); const [toast, setToast] = useState<ToastMessage | null>(null);
  const load = useCallback(() => { getBookmarks().then(setItems).catch((failure) => setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar os versículos.' : 'Unable to load saved verses.' })); }, [pt]);
  useFocusEffect(load);
  async function copy(item: Bookmark) { await Clipboard.setStringAsync(`${item.text} — ${localizedBibleBook(item.book, language)} ${item.chapterNumber}:${item.verseNumber}`); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Versículo copiado.' : 'Verse copied.' }); }
  async function remove(item: Bookmark) { setBusyId(item.verseId); try { await removeBookmark(item.verseId); setItems((current) => current?.filter((saved) => saved.verseId !== item.verseId) ?? []); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Versículo removido.' : 'Verse removed.' }); } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível remover.' : 'Unable to remove verse.' }); } finally { setBusyId(null); } }
  return <SettingsScreen title={pt ? 'Guardados' : 'Saved'} subtitle={pt ? 'Versículos destacados e guardados.' : 'Your highlighted and saved verses.'}>
    {!items ? <LoadingState label={pt ? 'A carregar versículos…' : 'Loading saved verses…'} /> : null}
    {items?.length === 0 ? <View style={styles.empty}><Ionicons name="bookmark-outline" size={34} color="#d98300" /><Text style={styles.emptyTitle}>{pt ? 'Ainda não há versículos guardados' : 'No saved verses yet'}</Text><Text style={styles.emptyText}>{pt ? 'Destaque um versículo na Bíblia para o encontrar aqui.' : 'Highlight a Bible verse and it will appear here.'}</Text></View> : null}
    <View style={styles.list}>{items?.map((item) => <View key={item.bookmarkId} style={[styles.card, { backgroundColor: item.highlightColor ?? '#CFE0FF' }]}><Text style={styles.reference}>{localizedBibleBook(item.book, language)} {item.chapterNumber}:{item.verseNumber}</Text><Text style={styles.text}>“{item.text}”</Text><View style={styles.actions}><Pressable onPress={() => copy(item)} style={styles.action}><Ionicons name="copy-outline" size={18} color="#303944" /><Text style={styles.actionText}>{pt ? 'Copiar' : 'Copy'}</Text></Pressable><Pressable disabled={busyId === item.verseId} onPress={() => remove(item)} style={styles.action}><Ionicons name="trash-outline" size={18} color="#9e3c35" /><Text style={[styles.actionText, styles.remove]}>{pt ? 'Remover' : 'Remove'}</Text></Pressable></View></View>)}</View>
    <Toast message={toast} onDismiss={() => setToast(null)} />
  </SettingsScreen>;
}
const styles = StyleSheet.create({ list: { gap: 12 }, card: { padding: 16, borderWidth: 1, borderColor: 'rgba(31,39,48,.08)', borderRadius: 13 }, reference: { color: '#9b5e08', fontSize: 13, fontWeight: '800' }, text: { marginTop: 9, color: '#202831', fontSize: 16, lineHeight: 25 }, actions: { marginTop: 13, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(31,39,48,.16)', flexDirection: 'row', gap: 20 }, action: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6 }, actionText: { color: '#303944', fontSize: 12, fontWeight: '700' }, remove: { color: '#9e3c35' }, empty: { minHeight: 230, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 12, color: '#17202a', fontSize: 16, fontWeight: '800' }, emptyText: { marginTop: 6, maxWidth: 270, color: '#75808e', fontSize: 12, lineHeight: 18, textAlign: 'center' } });
