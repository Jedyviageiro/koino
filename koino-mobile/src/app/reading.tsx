import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import {
  completeReading,
  getReadingData,
  removeBookmark,
  saveBookmark,
  saveReadingProgress,
} from '@/features/app/appService';
import type { ReadingData, ReadingVerse } from '@/features/app/types';
import { VerseHighlightModal } from '@/components/bible/VerseHighlightModal';
import { Toast, type ToastMessage } from '@/components/app/Toast';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleBook, localizedBibleReference } from '@/features/localization/bibleBooks';

function taskReference(data: ReadingData) {
  const first = data.task?.passages[0];
  const last = data.task?.passages.at(-1);
  if (!first || !last) return data.task?.readingAssignment ?? 'Today’s Reading';
  if (first.passageId !== last.passageId) return data.task?.readingAssignment ?? 'Today’s Reading';
  return `${first.bookTitle} ${first.chapterNumber}:${first.firstVerse}–${first.lastVerse}`;
}

export default function ReadingScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [data, setData] = useState<ReadingData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [textSize, setTextSize] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [highlights, setHighlights] = useState<Map<number, string>>(new Map());
  const [highlightVerse, setHighlightVerse] = useState<ReadingVerse | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ReadingVerse>>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getReadingData();
      if (!result.task || !result.verses.length) throw new Error(pt ? 'Ainda não há leitura disponível para hoje.' : 'There is no reading available for today yet.');
      const start = Math.min(result.verses.length, Math.max(1, result.task.currentVerseIndex || 1));
      setData(result);
      setCurrentIndex(start);
      setHighlights(new Map(result.bookmarks.map((item) => [item.verseId, item.highlightColor ?? '#CFE0FF'])));
      requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: start - 1, animated: false, viewPosition: 0.2 }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível abrir a leitura de hoje.' : 'Unable to open today’s reading.');
    }
  }, [pt]);

  useEffect(() => { load(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [load]);

  const progress = data?.verses.length ? ((currentIndex - 1) / data.verses.length) * 100 : 0;
  const font = [17, 20, 23][textSize];
  const lineHeight = [29, 33, 38][textSize];

  const reference = useMemo(() => data ? taskReference(data) : '', [data]);

  function select(index: number) {
    if (!data?.task || index < 1 || index > data.verses.length) return;
    setCurrentIndex(index);
    listRef.current?.scrollToIndex({ index: index - 1, animated: true, viewPosition: 0.25 });
    if (timer.current) clearTimeout(timer.current);
    setSaving(true);
    timer.current = setTimeout(async () => {
      try { await saveReadingProgress(data.task!.taskId, index); }
      catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível guardar a posição.' : 'Unable to save your reading position.' }); }
      finally { setSaving(false); }
    }, 250);
  }

  async function saveHighlight(color: string) {
    if (!highlightVerse) return;
    setSaving(true);
    try {
      await saveBookmark(highlightVerse.verseId, color);
      setHighlights((current) => new Map(current).set(highlightVerse.verseId, color));
      setHighlightVerse(null); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Versículo destacado.' : 'Verse highlighted.' });
    } catch (failure) {
      setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível destacar.' : 'Unable to highlight this verse.' });
    } finally { setSaving(false); }
  }
  async function removeHighlight() {
    if (!highlightVerse) return; setSaving(true);
    try { await removeBookmark(highlightVerse.verseId); setHighlights((current) => { const next = new Map(current); next.delete(highlightVerse.verseId); return next; }); setHighlightVerse(null); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Destaque removido.' : 'Highlight removed.' }); }
    catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível remover.' : 'Unable to remove highlight.' }); }
    finally { setSaving(false); }
  }

  async function next() {
    if (!data?.task || saving) return;
    if (currentIndex < data.verses.length) { select(currentIndex + 1); return; }
    setCompleting(true);
    try { await completeReading(data.task.taskId); router.replace('/home'); }
    catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível concluir a leitura.' : 'Unable to complete today’s reading.' }); setCompleting(false); }
  }

  if (!data && !error) return <AppShell active="plans"><LoadingState label={pt ? 'A abrir a leitura de hoje…' : 'Opening today’s reading…'} /></AppShell>;
  if (!data && error) return <AppShell active="plans"><ErrorState message={error} onRetry={load} /></AppShell>;
  if (!data?.task) return null;

  return (
    <AppShell active="plans">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color="#5e6877" /><Text style={styles.backText}>{pt ? 'Voltar ao plano' : 'Back to Plan'}</Text></Pressable>
        <View style={styles.actions}>
          <Pressable onPress={() => setTextSize((current) => (current + 1) % 3)} style={styles.action}><Text style={styles.aa}>Aa</Text></Pressable>
        </View>
      </View>

      <View style={styles.summary}>
        <View><Text style={styles.reference}>{localizedBibleReference(reference, language)}</Text><Text style={styles.day}>{pt ? 'Dia' : 'Day'} {data.task.dayNumber} {pt ? 'de' : 'of'} {data.plan?.totalDays ?? data.task.dayNumber}</Text></View>
        <View style={styles.summaryProgress}><Text style={styles.completeText}>{Math.round(progress)}% {pt ? 'concluído' : 'complete'}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(1, progress)}%` }]} /></View></View>
      </View>

      <FlatList
        ref={listRef}
        data={data.verses}
        keyExtractor={(item) => String(item.verseId)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={({ index }) => setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 200)}
        ListHeaderComponent={
          <View style={styles.chapterHeader}>
            <Text style={styles.chapterLabel}>{localizedBibleBook(data.verses[0]?.bookTitle, language)} {data.verses[0]?.chapterNumber}</Text>
            <Text style={styles.chapterTitle}>{data.verses[0]?.text}</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const active = index + 1 === currentIndex;
          const savedColor = highlights.get(item.verseId);
          return (
            <Pressable onPress={() => select(index + 1)} onLongPress={() => setHighlightVerse(item)} style={[styles.verse, active && styles.activeVerse, savedColor ? { backgroundColor: savedColor } : null]}>
              {active ? <View style={styles.activeBar} /> : null}
              <Text style={[styles.verseNumber, active && styles.activeNumber]}>{item.verseNumber}</Text>
              <Text style={[styles.verseText, { fontSize: font, lineHeight }]}>{item.text}</Text>
              {active ? <Pressable accessibilityLabel={pt ? 'Destacar versículo' : 'Highlight verse'} onPress={() => setHighlightVerse(item)} style={styles.highlightAction}><Ionicons name="color-fill-outline" size={19} color="#b66d00" /></Pressable> : null}
            </Pressable>
          );
        }}
      />

      <View style={styles.controls}>
        <Pressable disabled={currentIndex <= 1 || saving} onPress={() => select(currentIndex - 1)} style={[styles.controlButton, currentIndex <= 1 && styles.disabled]}><Ionicons name="chevron-back" size={25} color="#1b232c" /></Pressable>
        <Text style={styles.controlLabel}>{saving ? (pt ? 'A guardar…' : 'Saving…') : `${pt ? 'Versículo' : 'Verse'} ${currentIndex} ${pt ? 'de' : 'of'} ${data.verses.length}`}</Text>
        <Pressable disabled={saving || completing} onPress={next} style={[styles.controlButton, (saving || completing) && styles.disabled]}><Ionicons name={currentIndex === data.verses.length ? 'checkmark' : 'chevron-forward'} size={25} color="#1b232c" /></Pressable>
      </View>
      <VerseHighlightModal visible={Boolean(highlightVerse)} reference={highlightVerse ? `${localizedBibleBook(highlightVerse.bookTitle, language)} ${highlightVerse.chapterNumber}:${highlightVerse.verseNumber}` : ''} currentColor={highlightVerse ? highlights.get(highlightVerse.verseId) ?? null : null} language={language} saving={saving} onSave={saveHighlight} onRemove={removeHighlight} onClose={() => setHighlightVerse(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  topBar: { minHeight: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7 }, backText: { color: '#5e6877', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 7 },
  action: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: '#e7e9eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  aa: { color: '#111820', fontSize: 18, fontWeight: '600' },
  summary: { minHeight: 92, paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e8eb', borderTopLeftRadius: 18, borderTopRightRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reference: { color: '#161d25', fontSize: 18, fontWeight: '600' }, day: { marginTop: 7, color: '#6a7483', fontSize: 13 },
  summaryProgress: { width: '38%' }, completeText: { color: '#667080', fontSize: 12, textAlign: 'right' },
  track: { height: 5, marginTop: 12, borderRadius: 3, overflow: 'hidden', backgroundColor: '#e5e8eb' }, fill: { height: '100%', backgroundColor: '#eb920e' },
  listContent: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 20 },
  chapterHeader: { paddingHorizontal: 10, paddingBottom: 23 },
  chapterLabel: { color: '#c97800', fontSize: 14, fontWeight: '600' },
  chapterTitle: { marginTop: 12, color: '#111820', fontSize: 30, lineHeight: 40, fontStyle: 'italic', fontWeight: '700' },
  verse: { position: 'relative', marginVertical: 3, paddingLeft: 10, paddingRight: 12, paddingVertical: 13, borderRadius: 13, flexDirection: 'row', alignItems: 'flex-start' },
  activeVerse: { backgroundColor: '#fff7eb' }, savedVerse: { backgroundColor: '#fff3db' },
  activeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: '#ed940d' },
  verseNumber: { width: 34, paddingTop: 4, color: '#647087', fontSize: 13 }, activeNumber: { color: '#b96e00', fontWeight: '700' },
  verseText: { flex: 1, color: '#181f27' }, highlightAction: { width: 34, height: 34, marginLeft: 5, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { marginHorizontal: 16, marginBottom: 7, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff0ef' },
  errorText: { flex: 1, color: '#a33a34', fontSize: 11, lineHeight: 16 },
  controls: { minHeight: 62, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#e7e9eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  controlButton: { width: 48, height: 44, borderWidth: 1, borderColor: '#e4e7ea', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  controlLabel: { color: '#485363', fontSize: 13, fontWeight: '500' }, disabled: { opacity: 0.35 },
});
