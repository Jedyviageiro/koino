import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleBook } from '@/features/localization/bibleBooks';
import { apiRequest } from '@/services/api';
import { layout } from '@/theme/layout';
import { getBookmarks, removeBookmark, saveBookmark } from '@/features/app/appService';
import { VerseHighlightModal } from '@/components/bible/VerseHighlightModal';
import { Toast, type ToastMessage } from '@/components/app/Toast';
import { ActionSheet } from '@/components/app/ActionSheet';

type Version = { code: string; name: string };
type Book = { bookId: number; title: string; orderIndex: number };
type Chapter = { chapterId: number; chapterNumber: number; verseCount: number };
type Verse = { verseId: number; verseNumber: number; text: string };

export default function BibleScreen() {
  const params = useLocalSearchParams<{ book?: string; chapter?: string; verse?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const { language } = useLanguage();
  const [versions, setVersions] = useState<Version[]>([]), [books, setBooks] = useState<Book[]>([]), [chapters, setChapters] = useState<Chapter[]>([]), [verses, setVerses] = useState<Verse[]>([]);
  const [version, setVersion] = useState('KJV'); const [book, setBook] = useState<Book | null>(null); const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Map<number, string>>(new Map()); const [highlightVerse, setHighlightVerse] = useState<Verse | null>(null); const [actionVerse, setActionVerse] = useState<Verse | null>(null); const [savingHighlight, setSavingHighlight] = useState(false); const [toast, setToast] = useState<ToastMessage | null>(null);
  const pt = language === 'pt';
  const localizedVersions = versions.filter((item) => pt ? item.code === 'NVI' : item.code !== 'NVI');
  const visibleVersions = localizedVersions.length ? localizedVersions : versions.filter((item) => item.code === 'KJV');
  const loadLibrary = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [availableVersions, availableBooks] = await Promise.all([apiRequest<Version[]>('/bible/versions'), apiRequest<Book[]>('/bible/books')]);
      setVersions(availableVersions); setBooks(availableBooks);
      const languageVersions = availableVersions.filter((item) => pt ? item.code === 'NVI' : item.code !== 'NVI');
      const preferred = pt ? languageVersions.find((item) => item.code === 'NVI') : languageVersions.find((item) => item.code === 'NIV');
      setVersion(preferred?.code ?? languageVersions[0]?.code ?? availableVersions.find((item) => item.code === 'KJV')?.code ?? 'KJV');
      const requestedBook = availableBooks.find((item) => item.title.toLowerCase() === params.book?.toLowerCase());
      setBook(requestedBook ?? availableBooks[0] ?? null);
      getBookmarks().then((bookmarks) => setHighlights(new Map(bookmarks.map((item) => [item.verseId, item.highlightColor ?? '#CFE0FF'])))).catch(() => setHighlights(new Map()));
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar a Bíblia.' : 'Unable to load the Bible.'); }
    finally { setLoading(false); }
  }, [params.book, pt]);
  useEffect(() => { loadLibrary(); }, [loadLibrary]);
  useEffect(() => {
    if (!book) return;
    let active = true;
    setLoading(true); setError(''); setChapters([]); setChapter(null); setVerses([]);
    apiRequest<Chapter[]>(`/bible/books/${book.bookId}/chapters`)
      .then((items) => { if (active) { setChapters(items); const requested = book.title.toLowerCase() === params.book?.toLowerCase() ? Number(params.chapter) : NaN; setChapter(items.find((item) => item.chapterNumber === requested) ?? items[0] ?? null); setError(''); } })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar os capítulos.' : 'Unable to load chapters.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [book, params.book, params.chapter, pt]);
  useEffect(() => {
    if (!chapter || !version) return;
    let active = true;
    setLoading(true); setError(''); setVerses([]);
    apiRequest<Verse[]>(`/bible/chapters/${chapter.chapterId}/verses?version=${encodeURIComponent(version)}`)
      .then((items) => { if (active) { setVerses(items); setError(''); } })
      .catch((failure) => {
        if (!active) return;
        if (version !== 'KJV' && versions.some((item) => item.code === 'KJV')) {
          setToast({ id: Date.now(), tone: 'info', text: pt ? 'Esta tradução está temporariamente indisponível. A abrir KJV.' : 'That translation is temporarily unavailable. Opening KJV.' });
          setVersion('KJV');
          return;
        }
        setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar os versículos.' : 'Unable to load verses.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [chapter, pt, version, versions]);
  async function copyVerse(item: Verse) { const bookName = book ? localizedBibleBook(book.title, language) : ''; await Clipboard.setStringAsync(`${item.text} — ${bookName} ${chapter?.chapterNumber}:${item.verseNumber} (${version})`); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Versículo copiado.' : 'Verse copied.' }); }
  async function saveVerseHighlight(color: string) { if (!highlightVerse) return; setSavingHighlight(true); try { await saveBookmark(highlightVerse.verseId, color); setHighlights((current) => new Map(current).set(highlightVerse.verseId, color)); setHighlightVerse(null); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Versículo destacado.' : 'Verse highlighted.' }); } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível destacar.' : 'Unable to highlight verse.' }); } finally { setSavingHighlight(false); } }
  async function removeVerseHighlight() { if (!highlightVerse) return; setSavingHighlight(true); try { await removeBookmark(highlightVerse.verseId); setHighlights((current) => { const next = new Map(current); next.delete(highlightVerse.verseId); return next; }); setHighlightVerse(null); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Destaque removido.' : 'Highlight removed.' }); } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível remover.' : 'Unable to remove highlight.' }); } finally { setSavingHighlight(false); } }
  const requestedVerse = Number(params.verse);
  const actionReference = actionVerse ? `${book ? localizedBibleBook(book.title, language) : ''} ${chapter?.chapterNumber}:${actionVerse.verseNumber}` : '';
  return <AppShell active="bible"><ScrollView ref={scrollRef} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLibrary} tintColor="#e88f0c" />}>
    <View style={styles.heading}><View><Text style={styles.title}>{pt ? 'Bíblia' : 'Bible'}</Text><Text style={styles.subtitle}>{pt ? 'Leia, reflita e guarde a Palavra.' : 'Read, reflect, and keep the Word close.'}</Text></View><View style={styles.headingIcon}><Ionicons name="book-outline" size={25} color="#e88f0c" /></View></View>
    {error ? <ErrorState message={error} onRetry={loadLibrary} /> : null}{!books.length && loading ? <LoadingState label={pt ? 'A carregar a Bíblia…' : 'Loading the Bible…'} /> : null}
    <View style={styles.versionSelector}>{visibleVersions.map((item) => <Pressable key={item.code} onPress={() => setVersion(item.code)} style={[styles.versionPill, version === item.code && styles.versionPillActive]}><Text style={[styles.pillText, version === item.code && styles.pillTextActive]}>{item.code}</Text></Pressable>)}</View>
    <Text style={styles.label}>{pt ? 'Livro' : 'Book'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector}>{books.map((item) => <Pressable key={item.bookId} onPress={() => setBook(item)} style={[styles.pill, book?.bookId === item.bookId && styles.pillActive]}><Text style={[styles.pillText, book?.bookId === item.bookId && styles.pillTextActive]}>{localizedBibleBook(item.title, language)}</Text></Pressable>)}</ScrollView>
    <Text style={styles.label}>{pt ? 'Capítulo' : 'Chapter'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector}>{chapters.map((item) => <Pressable key={item.chapterId} onPress={() => setChapter(item)} style={[styles.chapter, chapter?.chapterId === item.chapterId && styles.pillActive]}><Text style={[styles.pillText, chapter?.chapterId === item.chapterId && styles.pillTextActive]}>{item.chapterNumber}</Text></Pressable>)}</ScrollView>
    <View style={styles.passageHeader}><Text style={styles.passageTitle}>{book ? localizedBibleBook(book.title, language) : ''} {chapter?.chapterNumber}</Text><Text style={styles.version}>{version}</Text></View>
    <View style={styles.verses}>{verses.map((item) => <View key={item.verseId} onLayout={(event) => { if (item.verseNumber === requestedVerse) { const verseY = event.nativeEvent.layout.y; setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, verseY + 220), animated: true }), 120); } }} style={[styles.verse, highlights.has(item.verseId) ? { backgroundColor: highlights.get(item.verseId) } : null, item.verseNumber === requestedVerse && styles.requestedVerse]}><Text style={styles.number}>{item.verseNumber}</Text><Text selectable style={styles.verseText}>{item.text}</Text><Pressable accessibilityLabel={pt ? 'Ações do versículo' : 'Verse actions'} onPress={() => setActionVerse(item)} style={styles.verseAction}><Ionicons name="ellipsis-horizontal" size={18} color="#7b8490" /></Pressable></View>)}</View>
  </ScrollView><ActionSheet visible={Boolean(actionVerse)} title={actionReference} subtitle={actionVerse?.text} cancelLabel={pt ? 'Cancelar' : 'Cancel'} onClose={() => setActionVerse(null)} actions={actionVerse ? [{ key: 'highlight', label: pt ? 'Destacar versículo' : 'Highlight verse', icon: 'color-fill-outline', onPress: () => setHighlightVerse(actionVerse) }, { key: 'copy', label: pt ? 'Copiar versículo' : 'Copy verse', icon: 'copy-outline', onPress: () => copyVerse(actionVerse) }] : []} /><VerseHighlightModal visible={Boolean(highlightVerse)} reference={highlightVerse ? `${book ? localizedBibleBook(book.title, language) : ''} ${chapter?.chapterNumber}:${highlightVerse.verseNumber}` : ''} currentColor={highlightVerse ? highlights.get(highlightVerse.verseId) ?? null : null} language={language} saving={savingHighlight} onSave={saveVerseHighlight} onRemove={removeVerseHighlight} onClose={() => setHighlightVerse(null)} /><Toast message={toast} onDismiss={() => setToast(null)} /></AppShell>;
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, paddingBottom: 30 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headingIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e8' }, title: { color: '#111820', fontSize: 34, letterSpacing: -0.8, fontWeight: '800' }, subtitle: { marginTop: 3, color: '#727b88', fontSize: layout.subtitleSize },
  versionSelector: { alignSelf: 'flex-start', marginTop: 22, padding: 3, borderWidth: 1, borderColor: '#e1e4e7', borderRadius: 22, flexDirection: 'row', backgroundColor: '#fafafa' }, versionPill: { minWidth: 66, height: 35, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, versionPillActive: { backgroundColor: '#fff2df' },
  label: { marginTop: 18, marginBottom: 9, color: '#3f4854', fontSize: 12, fontWeight: '700' }, selector: { gap: 7, paddingRight: 16 }, pill: { height: 38, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e0e4e8', borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, chapter: { width: 38, height: 38, borderWidth: 1, borderColor: '#e0e4e8', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, pillActive: { borderColor: '#e88f0c', backgroundColor: '#fff6e9' }, pillText: { color: '#66707d', fontSize: 12 }, pillTextActive: { color: '#d77d00', fontWeight: '700' },
  passageHeader: { marginTop: 23, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eceef0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, passageTitle: { color: '#151c24', fontSize: 27, fontStyle: 'italic', fontWeight: '700', letterSpacing: -0.4 }, version: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, color: '#737c88', fontSize: 11, backgroundColor: '#f2f3f4' }, verses: {}, verse: { minHeight: 64, marginVertical: 3, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 13, flexDirection: 'row', alignItems: 'flex-start' }, requestedVerse: { borderWidth: 1, borderColor: '#e89a28', backgroundColor: '#fff8ec' }, number: { width: 30, paddingTop: 3, color: '#dc8300', fontSize: 13, fontWeight: '700' }, verseText: { flex: 1, color: '#252c35', fontSize: 16, lineHeight: 27 }, verseAction: { width: 34, height: 34, marginLeft: 5, alignItems: 'center', justifyContent: 'center' },
});
