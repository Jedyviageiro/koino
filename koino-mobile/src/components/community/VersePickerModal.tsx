import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBookChapters, getChapterVerses } from '@/features/community/communityService';
import type { BibleBook, BibleChapter, BibleVerseOption, CommunityVerse } from '@/features/community/types';

export function VersePickerModal({ visible, books, onClose, onSelect }: { visible: boolean; books: BibleBook[]; onClose: () => void; onSelect: (verse: CommunityVerse) => void }) {
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [verses, setVerses] = useState<BibleVerseOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!visible) { setBook(null); setChapter(null); setChapters([]); setVerses([]); } }, [visible]);

  async function chooseBook(next: BibleBook) {
    setLoading(true); setBook(next);
    try { setChapters(await getBookChapters(next.bookId)); }
    finally { setLoading(false); }
  }

  async function chooseChapter(next: BibleChapter) {
    setLoading(true); setChapter(next);
    try { setVerses(await getChapterVerses(next.chapterId)); }
    finally { setLoading(false); }
  }

  const title = chapter ? `${book?.title} ${chapter.chapterNumber}` : book ? book.title : 'Choose a book';
  const values = chapter ? verses : book ? chapters : books;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.header}>
          {book ? <Pressable onPress={() => chapter ? (setChapter(null), setVerses([])) : (setBook(null), setChapters([]))} style={styles.iconButton}><MaterialCommunityIcons name="arrow-left" size={24} color="#202831" /></Pressable> : <View style={styles.iconButton} />}
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} style={styles.iconButton}><MaterialCommunityIcons name="close" size={24} color="#202831" /></Pressable>
        </View>
        {loading ? <View style={styles.loading}><ActivityIndicator color="#e68d08" size="large" /></View> : (
          <ScrollView contentContainerStyle={styles.list}>
            {values.map((item) => {
              if ('verseNumber' in item) {
                return <Pressable key={item.verseId} onPress={() => { onSelect({ verseId: item.verseId, reference: `${book!.title} ${chapter!.chapterNumber}:${item.verseNumber}`, text: item.text }); onClose(); }} style={styles.verseRow}><Text style={styles.verseNumber}>{item.verseNumber}</Text><Text style={styles.verseText}>{item.text}</Text></Pressable>;
              }
              if ('chapterNumber' in item) return <Pressable key={item.chapterId} onPress={() => chooseChapter(item)} style={styles.row}><Text style={styles.rowText}>Chapter {item.chapterNumber}</Text><MaterialCommunityIcons name="chevron-right" size={23} color="#737c88" /></Pressable>;
              return <Pressable key={item.bookId} onPress={() => chooseBook(item)} style={styles.row}><Text style={styles.rowText}>{item.title}</Text><MaterialCommunityIcons name="chevron-right" size={23} color="#737c88" /></Pressable>;
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 58, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e8eaed', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#161d25', fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 17 },
  row: { minHeight: 55, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#eff0f2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { color: '#202831', fontSize: 15, fontWeight: '600' },
  verseRow: { paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eff0f2', flexDirection: 'row', alignItems: 'flex-start' },
  verseNumber: { width: 34, color: '#b66d00', fontSize: 13, fontWeight: '700' },
  verseText: { flex: 1, color: '#303944', fontSize: 14, lineHeight: 22 },
});
