import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { getAuthSession } from '@/features/auth/authStorage';
import { getHomeData } from '@/features/app/appService';
import type { HomeData, UserPlanTask } from '@/features/app/types';
import { layout } from '@/theme/layout';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleBook, localizedBibleReference } from '@/features/localization/bibleBooks';

const cover = require('../../assets/images/plans-cover.png');
const verseBanner = require('../../assets/images/verse-of-day-banner.png');

function verseCount(task: UserPlanTask | null) {
  return task?.passages.reduce((sum, passage) => sum + passage.lastVerse - passage.firstVerse + 1, 0) ?? 0;
}

function readingTitle(task: UserPlanTask | null, language = 'en') {
  const passage = task?.passages[0];
  if (!passage) return task?.readingAssignment ?? 'Today’s Reading';
  const end = passage.lastVerse === passage.firstVerse ? '' : `–${passage.lastVerse}`;
  return `${localizedBibleBook(passage.bookTitle, language)} ${passage.chapterNumber}:${passage.firstVerse}${end}`;
}

function bibleLink(reference: string) {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);
  return match ? { pathname: '/bible' as const, params: { book: match[1], chapter: match[2], verse: match[3] } } : '/bible' as const;
}

export default function HomeScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [data, setData] = useState<HomeData | null>(null);
  const [name, setName] = useState('Friend');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError('');
    try {
      const [home, session] = await Promise.all([getHomeData(), getAuthSession()]);
      setData(home);
      setName(session?.fullname?.trim().split(/\s+/)[0] || (pt ? 'Amigo' : 'Friend'));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar o início.' : 'Unable to load your home page.');
    } finally {
      setRefreshing(false);
    }
  }, [pt]);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = pt ? (hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite') : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  const progress = Math.round(data?.plan?.completionPercentage ?? 0);

  return (
    <AppShell active="home">
      {!data && !error ? <LoadingState label={pt ? 'A preparar o seu dia…' : 'Preparing your day…'} /> : null}
      {!data && error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {data ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#e5951d" />}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>{greeting}, {name.replace(/\p{Extended_Pictographic}/gu, '').trim().toLowerCase()}</Text>
              <Text style={styles.subtitle}>{pt ? 'Vamos crescer juntos na fé.' : 'Let’s grow closer to God together.'}</Text>
            </View>
          </View>

          <View style={styles.verseCard}>
            <Image source={verseBanner} style={styles.verseImage} contentFit="cover" />
            <View style={styles.verseOverlay} />
            <View style={styles.verseContent}>
              <View style={styles.verseHeader}>
                <View style={styles.cardLabelRow}>
                  <View style={styles.roundIcon}><Ionicons name="sunny-outline" size={21} color="#d97e00" /></View>
                  <View><Text style={styles.verseEyebrow}>{pt ? 'Versículo do dia' : 'Verse of the Day'}</Text><Text style={styles.reference}>{localizedBibleReference(data.verseOfDay.reference, language)}</Text></View>
                </View>
              </View>
              <Text numberOfLines={5} style={styles.quote}>“{data.verseOfDay.text}”</Text>
              <Pressable onPress={() => router.push(bibleLink(data.verseOfDay.reference))} style={styles.viewBible}>
                <Text style={styles.viewBibleText}>{pt ? 'Ver na Bíblia' : 'View in Bible'}</Text><Ionicons name="arrow-forward" size={19} color="#1f2933" />
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{pt ? 'Continuar' : 'Continue'}</Text>
            <Pressable onPress={() => router.push('/plans')} style={styles.inlineLink}>
              <Text style={styles.linkText}>{pt ? 'Ver plano' : 'View Plan'}</Text>
              <Ionicons name="chevron-forward" size={21} color="#d78105" />
            </Pressable>
          </View>

          {data.plan ? (
            <Pressable onPress={() => router.push('/devotional')} style={styles.continueCard}>
              <Image source={cover} style={styles.cover} contentFit="cover" />
              <View style={styles.continueCopy}>
                <Text style={styles.planName}>{data.plan.name}</Text>
                <Text style={styles.planDay}>{pt ? 'Dia' : 'Day'} {data.task?.dayNumber ?? data.plan.completedDays} {pt ? 'de' : 'of'} {data.plan.totalDays}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(1, progress)}%` }]} /></View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/onboarding')} style={styles.emptyCard}>
              <Ionicons name="library-outline" size={28} color="#cb7c0c" />
              <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>{pt ? 'Crie o seu primeiro plano' : 'Build your first plan'}</Text><Text style={styles.emptyText}>{pt ? 'Conclua a introdução para começar.' : 'Complete onboarding to begin your journey.'}</Text></View>
              <Ionicons name="chevron-forward" size={22} color="#68717d" />
            </Pressable>
          )}

          <View style={styles.readingCard}>
            <View style={styles.cardLabelRow}>
              <View style={styles.roundIcon}><Ionicons name="book-outline" size={21} color="#202830" /></View>
              <Text style={styles.cardLabel}>{pt ? 'Leitura de hoje' : 'Today’s Reading'}</Text>
            </View>
            {data.task ? (
              <>
                <Pressable onPress={() => router.push('/devotional')} style={styles.readingHeading}>
                  <View><Text style={styles.readingTitle}>{readingTitle(data.task, language)}</Text><Text style={styles.readingAssignment}>{localizedBibleReference(data.task.readingAssignment, language)}</Text></View>
                  <Ionicons name="chevron-forward" size={23} color="#1b222a" />
                </Pressable>
                <View style={styles.chips}>
                  <View style={styles.chip}><Ionicons name="time-outline" size={19} color="#1d252d" /><Text style={styles.chipText}>{data.task.estimatedMinutes} {pt ? 'min de leitura' : 'min read'}</Text></View>
                  <View style={styles.chip}><Ionicons name="document-text-outline" size={18} color="#1d252d" /><Text style={styles.chipText}>{verseCount(data.task)} {pt ? 'versículos' : 'verses'}</Text></View>
                </View>
                <Pressable onPress={() => router.push('/reading')} style={styles.primaryButton}>
                  <Ionicons name="book-outline" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>{pt ? (data.task.currentVerseIndex > 1 ? 'Continuar leitura' : 'Começar leitura') : (data.task.currentVerseIndex > 1 ? 'Continue Reading' : 'Start Reading')}</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.noReading}>{pt ? 'Terminou por hoje. A próxima leitura aparecerá aqui.' : 'You’re caught up for today. Your next reading will appear here.'}</Text>
            )}
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}><Text style={styles.cardLabel}>{pt ? 'Sua sequência' : 'Your Streak'}</Text><Text style={styles.muted}>{pt ? 'Últimos 7 dias' : 'Last 7 days'}</Text></View>
            <View style={styles.streakBody}>
              <View style={styles.flameRing}><Ionicons name="flame-outline" size={28} color="#ef9513" /></View>
              <View><Text style={styles.streakNumber}>{data.streak.currentStreak}</Text><Text style={styles.streakCaption}>{pt ? 'Dias seguidos' : 'Day in a row'}</Text></View>
              <View style={styles.days}>
                {data.streak.recentDays.map((day) => (
                  <View key={day.date} style={styles.day}>
                    <Text style={styles.dayName}>{new Intl.DateTimeFormat(pt ? 'pt' : 'en', { weekday: 'narrow' }).format(new Date(`${day.date}T00:00:00`))}</Text>
                    <View style={[styles.dayDot, day.active && styles.dayDotActive]}>{day.active ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}</View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingTop: layout.screenTop, paddingBottom: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  headerCopy: { flex: 1 },
  greeting: { color: '#111820', fontSize: 25, lineHeight: 31, fontWeight: '800' },
  subtitle: { marginTop: 3, color: '#777d86', fontSize: 13, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#111820', fontSize: 19, fontWeight: '700' },
  inlineLink: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: '#d78105', fontSize: 14, fontWeight: '600' },
  continueCard: { minHeight: 104, padding: 12, borderRadius: layout.cardRadius, borderWidth: 1, borderColor: '#f0dfc8', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf3' },
  cover: { width: 58, height: 76, borderRadius: 10 },
  continueCopy: { flex: 1, marginLeft: 15 },
  planName: { color: '#121922', fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 17 },
  planDay: { marginTop: 6, color: '#6d747e', fontSize: 13 },
  progressRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e8e9eb' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#ed9412' },
  progressText: { color: '#747a83', fontSize: 13 },
  emptyCard: { minHeight: 100, paddingHorizontal: 18, borderWidth: 1, borderColor: '#eadfcf', borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf3' },
  emptyCopy: { flex: 1, marginLeft: 14 }, emptyTitle: { fontSize: 16, fontWeight: '700' }, emptyText: { marginTop: 3, color: '#747b85', fontSize: 12 },
  readingCard: { padding: 14, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: layout.cardRadius, backgroundColor: '#fff' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ec' },
  cardLabel: { color: '#151b22', fontSize: 17, fontWeight: '700' },
  readingHeading: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readingTitle: { color: '#121922', fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 23 },
  readingAssignment: { marginTop: 5, color: '#747b85', fontSize: 14 },
  chips: { marginTop: 17, flexDirection: 'row', gap: 12 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f8f8' },
  chipText: { color: '#1c232b', fontSize: 13, fontWeight: '600' },
  primaryButton: { height: 46, marginTop: 14, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ec9410' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noReading: { marginTop: 17, color: '#717985', fontSize: 14, lineHeight: 21 },
  verseCard: { minHeight: 238, borderWidth: 1, borderColor: '#eadfce', borderRadius: 18, overflow: 'hidden', backgroundColor: '#f5eadc' },
  verseImage: { ...StyleSheet.absoluteFillObject },
  verseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.72)' },
  verseContent: { flex: 1, padding: 17, justifyContent: 'space-between' },
  verseHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  verseEyebrow: { color: '#66707c', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  quote: { marginVertical: 17, color: '#17202a', fontFamily: 'Poppins_400Regular', fontSize: 18, lineHeight: 28 },
  reference: { marginTop: 3, color: '#18212a', fontSize: 14, fontWeight: '800' },
  viewBible: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.72)' },
  viewBibleText: { color: '#1f2933', fontSize: 13, fontWeight: '700' },
  streakCard: { padding: 15, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: layout.cardRadius, backgroundColor: '#fff' },
  streakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muted: { color: '#818792', fontSize: 13 },
  streakBody: { marginTop: 18, flexDirection: 'row', alignItems: 'center' },
  flameRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 5, borderColor: '#f7d9ad', alignItems: 'center', justifyContent: 'center' },
  streakNumber: { marginLeft: 14, color: '#161c23', fontSize: 22, fontWeight: '700' },
  streakCaption: { marginLeft: 14, marginTop: 3, color: '#727984', fontSize: 12 },
  days: { flex: 1, marginLeft: 14, flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 7 }, dayName: { color: '#5f6670', fontSize: 10 },
  dayDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#d9dde1', alignItems: 'center', justifyContent: 'center' },
  dayDotActive: { borderColor: '#e9900c', backgroundColor: '#e9900c' },
});
