import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { HeaderActions } from '@/components/app/HeaderActions';
import { getAuthSession } from '@/features/auth/authStorage';
import { getHomeData } from '@/features/app/appService';
import type { HomeData, UserPlanTask } from '@/features/app/types';

const cover = require('../../assets/images/plans-cover.png');

function verseCount(task: UserPlanTask | null) {
  return task?.passages.reduce((sum, passage) => sum + passage.lastVerse - passage.firstVerse + 1, 0) ?? 0;
}

function readingTitle(task: UserPlanTask | null) {
  const passage = task?.passages[0];
  if (!passage) return task?.readingAssignment ?? 'Today’s Reading';
  const end = passage.lastVerse === passage.firstVerse ? '' : `–${passage.lastVerse}`;
  return `${passage.bookTitle} ${passage.chapterNumber}:${passage.firstVerse}${end}`;
}

export default function HomeScreen() {
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
      setName(session?.fullname?.trim().split(/\s+/)[0] || 'Friend');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to load your home page.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const progress = Math.round(data?.plan?.completionPercentage ?? 0);
  const unread = data?.notifications.some((item) => !item.read) ?? false;

  return (
    <AppShell active="home">
      {!data && !error ? <LoadingState label="Preparing your day…" /> : null}
      {!data && error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {data ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#e5951d" />}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>{greeting}, {name.toLowerCase()}</Text>
              <Text style={styles.subtitle}>Let’s grow closer to God together.</Text>
            </View>
            <HeaderActions unread={unread} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue</Text>
            <Pressable onPress={() => router.push('/plans')} style={styles.inlineLink}>
              <Text style={styles.linkText}>View Plan</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#d78105" />
            </Pressable>
          </View>

          {data.plan ? (
            <Pressable onPress={() => router.push('/devotional')} style={styles.continueCard}>
              <Image source={cover} style={styles.cover} contentFit="cover" />
              <View style={styles.continueCopy}>
                <Text style={styles.planName}>{data.plan.name}</Text>
                <Text style={styles.planDay}>Day {data.task?.dayNumber ?? data.plan.completedDays} of {data.plan.totalDays}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(1, progress)}%` }]} /></View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/onboarding')} style={styles.emptyCard}>
              <MaterialCommunityIcons name="book-plus-outline" size={30} color="#cb7c0c" />
              <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>Build your first plan</Text><Text style={styles.emptyText}>Complete onboarding to begin your journey.</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={25} color="#68717d" />
            </Pressable>
          )}

          <View style={styles.readingCard}>
            <View style={styles.cardLabelRow}>
              <View style={styles.roundIcon}><MaterialCommunityIcons name="book-open-page-variant-outline" size={24} color="#202830" /></View>
              <Text style={styles.cardLabel}>Today’s Reading</Text>
            </View>
            {data.task ? (
              <>
                <Pressable onPress={() => router.push('/devotional')} style={styles.readingHeading}>
                  <View><Text style={styles.readingTitle}>{readingTitle(data.task)}</Text><Text style={styles.readingAssignment}>{data.task.readingAssignment}</Text></View>
                  <MaterialCommunityIcons name="chevron-right" size={27} color="#1b222a" />
                </Pressable>
                <View style={styles.chips}>
                  <View style={styles.chip}><MaterialCommunityIcons name="clock-outline" size={21} color="#1d252d" /><Text style={styles.chipText}>{data.task.estimatedMinutes} min read</Text></View>
                  <View style={styles.chip}><MaterialCommunityIcons name="text-box-outline" size={20} color="#1d252d" /><Text style={styles.chipText}>{verseCount(data.task)} verses</Text></View>
                </View>
                <Pressable onPress={() => router.push('/reading')} style={styles.primaryButton}>
                  <MaterialCommunityIcons name="book-open-outline" size={25} color="#fff" />
                  <Text style={styles.primaryButtonText}>{data.task.currentVerseIndex > 1 ? 'Continue Reading' : 'Start Reading'}</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.noReading}>You’re caught up for today. Your next reading will appear here.</Text>
            )}
          </View>

          <View style={styles.verseCard}>
            <View style={styles.cardLabelRow}>
              <View style={styles.roundIcon}><MaterialCommunityIcons name="white-balance-sunny" size={24} color="#e38a06" /></View>
              <Text style={styles.cardLabel}>Verse of the Day</Text>
            </View>
            <Text style={styles.quote}>“{data.verseOfDay.text}”</Text>
            <Text style={styles.reference}>{data.verseOfDay.reference}</Text>
            <Pressable onPress={() => router.push('/bible')} style={styles.viewBible}>
              <Text style={styles.viewBibleText}>View in Bible</Text><MaterialCommunityIcons name="chevron-right" size={21} color="#4f5864" />
            </Pressable>
            <View style={styles.sun} /><View style={styles.mountainOne} /><View style={styles.mountainTwo} />
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}><Text style={styles.cardLabel}>Your Streak</Text><Text style={styles.muted}>Last 7 days</Text></View>
            <View style={styles.streakBody}>
              <View style={styles.flameRing}><MaterialCommunityIcons name="fire" size={31} color="#ef9513" /></View>
              <View><Text style={styles.streakNumber}>{data.streak.currentStreak}</Text><Text style={styles.streakCaption}>Day in a row</Text></View>
              <View style={styles.days}>
                {data.streak.recentDays.map((day) => (
                  <View key={day.date} style={styles.day}>
                    <Text style={styles.dayName}>{new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(new Date(`${day.date}T00:00:00`))}</Text>
                    <View style={[styles.dayDot, day.active && styles.dayDotActive]}>{day.active ? <MaterialCommunityIcons name="check" size={13} color="#fff" /> : null}</View>
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
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  headerCopy: { flex: 1 },
  greeting: { color: '#111820', fontSize: 26, lineHeight: 33, fontWeight: '800' },
  subtitle: { marginTop: 5, color: '#777d86', fontSize: 15, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#111820', fontSize: 19, fontWeight: '700' },
  inlineLink: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: '#d78105', fontSize: 14, fontWeight: '600' },
  continueCard: { minHeight: 126, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: '#f0dfc8', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf3' },
  cover: { width: 70, height: 94, borderRadius: 12 },
  continueCopy: { flex: 1, marginLeft: 15 },
  planName: { color: '#121922', fontSize: 20, fontWeight: '700' },
  planDay: { marginTop: 8, color: '#6d747e', fontSize: 15 },
  progressRow: { marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e8e9eb' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#ed9412' },
  progressText: { color: '#747a83', fontSize: 13 },
  emptyCard: { minHeight: 100, paddingHorizontal: 18, borderWidth: 1, borderColor: '#eadfcf', borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf3' },
  emptyCopy: { flex: 1, marginLeft: 14 }, emptyTitle: { fontSize: 16, fontWeight: '700' }, emptyText: { marginTop: 3, color: '#747b85', fontSize: 12 },
  readingCard: { padding: 17, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 17, backgroundColor: '#fff' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ec' },
  cardLabel: { color: '#151b22', fontSize: 17, fontWeight: '700' },
  readingHeading: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readingTitle: { color: '#121922', fontSize: 23, fontWeight: '700' },
  readingAssignment: { marginTop: 5, color: '#747b85', fontSize: 14 },
  chips: { marginTop: 17, flexDirection: 'row', gap: 12 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f8f8' },
  chipText: { color: '#1c232b', fontSize: 13, fontWeight: '600' },
  primaryButton: { height: 53, marginTop: 17, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, backgroundColor: '#ec9410' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noReading: { marginTop: 17, color: '#717985', fontSize: 14, lineHeight: 21 },
  verseCard: { minHeight: 230, padding: 18, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 17, overflow: 'hidden', backgroundColor: '#fff' },
  quote: { marginTop: 19, maxWidth: '78%', color: '#182028', fontSize: 17, lineHeight: 27, fontWeight: '600' },
  reference: { marginTop: 13, color: '#dc8400', fontSize: 14, fontWeight: '600' },
  viewBible: { marginTop: 17, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  viewBibleText: { color: '#4f5864', fontSize: 13 },
  sun: { position: 'absolute', right: 46, bottom: 20, width: 62, height: 62, borderRadius: 31, backgroundColor: '#fde3c1', opacity: 0.6 },
  mountainOne: { position: 'absolute', right: -36, bottom: -42, width: 180, height: 120, borderRadius: 70, backgroundColor: '#efd5bd', transform: [{ rotate: '-12deg' }], opacity: 0.75 },
  mountainTwo: { position: 'absolute', right: 58, bottom: -55, width: 150, height: 105, borderRadius: 62, backgroundColor: '#f9e8d5', transform: [{ rotate: '17deg' }], opacity: 0.85 },
  streakCard: { padding: 18, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 17, backgroundColor: '#fff' },
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
