import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleBook } from '@/features/localization/bibleBooks';
import { apiRequest } from '@/services/api';
import { layout } from '@/theme/layout';

type Version = { code: string; name: string };
type Book = { bookId: number; title: string; orderIndex: number };
type Chapter = { chapterId: number; chapterNumber: number; verseCount: number };
type Verse = { verseId: number; verseNumber: number; text: string };

export default function BibleScreen() {
  const { language } = useLanguage();
  const [versions, setVersions] = useState<Version[]>([]), [books, setBooks] = useState<Book[]>([]), [chapters, setChapters] = useState<Chapter[]>([]), [verses, setVerses] = useState<Verse[]>([]);
  const [version, setVersion] = useState('KJV'); const [book, setBook] = useState<Book | null>(null); const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const pt = language === 'pt';
  const loadLibrary = useCallback(async () => {
    setLoading(true); setError('');
    try { const [availableVersions, availableBooks] = await Promise.all([apiRequest<Version[]>('/bible/versions'), apiRequest<Book[]>('/bible/books')]); setVersions(availableVersions); setBooks(availableBooks); const preferred = pt ? availableVersions.find((item) => /NVI|ARA|ARC/i.test(item.code)) : availableVersions.find((item) => item.code === 'KJV'); setVersion(preferred?.code ?? availableVersions[0]?.code ?? 'KJV'); setBook(availableBooks[0] ?? null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar a Bíblia.' : 'Unable to load the Bible.'); }
    finally { setLoading(false); }
  }, [pt]);
  useEffect(() => { loadLibrary(); }, [loadLibrary]);
  useEffect(() => { if (book) apiRequest<Chapter[]>(`/bible/books/${book.bookId}/chapters`).then((items) => { setChapters(items); setChapter(items[0] ?? null); }).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to load chapters.')); }, [book]);
  useEffect(() => { if (chapter) { setLoading(true); apiRequest<Verse[]>(`/bible/chapters/${chapter.chapterId}/verses?version=${encodeURIComponent(version)}`).then(setVerses).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to load verses.')).finally(() => setLoading(false)); } }, [chapter, version]);
  function openVerseActions(item: Verse) { const bookName = book ? localizedBibleBook(book.title, language) : ''; Alert.alert(`${bookName} ${chapter?.chapterNumber}:${item.verseNumber}`, undefined, [{ text: pt ? 'Copiar versículo' : 'Copy verse', onPress: () => Clipboard.setStringAsync(`${item.text} — ${bookName} ${chapter?.chapterNumber}:${item.verseNumber} (${version})`) }, { text: pt ? 'Cancelar' : 'Cancel', style: 'cancel' }]); }
  return <AppShell active="bible"><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLibrary} tintColor="#e88f0c" />}>
    <View style={styles.heading}><View><Text style={styles.title}>{pt ? 'Bíblia' : 'Bible'}</Text><Text style={styles.subtitle}>{pt ? 'Leia, reflita e guarde a Palavra.' : 'Read, reflect, and keep the Word close.'}</Text></View><View style={styles.headingIcon}><Ionicons name="book-outline" size={25} color="#e88f0c" /></View></View>
    {error ? <ErrorState message={error} onRetry={loadLibrary} /> : null}{!books.length && loading ? <LoadingState label={pt ? 'A carregar a Bíblia…' : 'Loading the Bible…'} /> : null}
    <View style={styles.versionSelector}>{versions.map((item) => <Pressable key={item.code} onPress={() => setVersion(item.code)} style={[styles.versionPill, version === item.code && styles.versionPillActive]}><Text style={[styles.pillText, version === item.code && styles.pillTextActive]}>{item.code}</Text></Pressable>)}</View>
    <Text style={styles.label}>{pt ? 'Livro' : 'Book'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector}>{books.map((item) => <Pressable key={item.bookId} onPress={() => setBook(item)} style={[styles.pill, book?.bookId === item.bookId && styles.pillActive]}><Text style={[styles.pillText, book?.bookId === item.bookId && styles.pillTextActive]}>{localizedBibleBook(item.title, language)}</Text></Pressable>)}</ScrollView>
    <Text style={styles.label}>{pt ? 'Capítulo' : 'Chapter'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector}>{chapters.map((item) => <Pressable key={item.chapterId} onPress={() => setChapter(item)} style={[styles.chapter, chapter?.chapterId === item.chapterId && styles.pillActive]}><Text style={[styles.pillText, chapter?.chapterId === item.chapterId && styles.pillTextActive]}>{item.chapterNumber}</Text></Pressable>)}</ScrollView>
    <View style={styles.passageHeader}><Text style={styles.passageTitle}>{book ? localizedBibleBook(book.title, language) : ''} {chapter?.chapterNumber}</Text><Text style={styles.version}>{version}</Text></View>
    <View style={styles.verses}>{verses.map((item) => <View key={item.verseId} style={styles.verse}><Text style={styles.number}>{item.verseNumber}</Text><Text selectable style={styles.verseText}>{item.text}</Text><Pressable accessibilityLabel={pt ? 'Ações do versículo' : 'Verse actions'} onPress={() => openVerseActions(item)} style={styles.verseAction}><Ionicons name="ellipsis-horizontal" size={18} color="#7b8490" /></Pressable></View>)}</View>
  </ScrollView></AppShell>;
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, paddingBottom: 30 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headingIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e8' }, title: { color: '#111820', fontSize: 34, letterSpacing: -0.8, fontWeight: '800' }, subtitle: { marginTop: 3, color: '#727b88', fontSize: layout.subtitleSize },
  versionSelector: { alignSelf: 'flex-start', marginTop: 22, padding: 3, borderWidth: 1, borderColor: '#e1e4e7', borderRadius: 22, flexDirection: 'row', backgroundColor: '#fafafa' }, versionPill: { minWidth: 66, height: 35, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, versionPillActive: { backgroundColor: '#fff2df' },
  label: { marginTop: 18, marginBottom: 9, color: '#3f4854', fontSize: 12, fontWeight: '700' }, selector: { gap: 7, paddingRight: 16 }, pill: { height: 38, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e0e4e8', borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, chapter: { width: 38, height: 38, borderWidth: 1, borderColor: '#e0e4e8', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, pillActive: { borderColor: '#e88f0c', backgroundColor: '#fff6e9' }, pillText: { color: '#66707d', fontSize: 12 }, pillTextActive: { color: '#d77d00', fontWeight: '700' },
  passageHeader: { marginTop: 23, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eceef0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, passageTitle: { color: '#151c24', fontSize: 27, letterSpacing: -0.4, fontWeight: '800' }, version: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, color: '#737c88', fontSize: 11, backgroundColor: '#f2f3f4' }, verses: {}, verse: { minHeight: 64, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7e9', flexDirection: 'row', alignItems: 'flex-start' }, number: { width: 30, paddingTop: 3, color: '#dc8300', fontSize: 13, fontWeight: '700' }, verseText: { flex: 1, color: '#252c35', fontFamily: 'serif', fontSize: 17, lineHeight: 27 }, verseAction: { width: 34, height: 34, marginLeft: 5, alignItems: 'center', justifyContent: 'center' },
});
