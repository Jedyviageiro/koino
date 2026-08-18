import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { HeaderActions } from '@/components/app/HeaderActions';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { getPlansData } from '@/features/app/appService';
import type { PlansData } from '@/features/app/types';

const cover = require('../../assets/images/plans-cover.png');

export default function PlansScreen() {
  const [data, setData] = useState<PlansData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError('');
    try { setData(await getPlansData()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load your plans.'); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentPlan = useMemo(() => data?.userPlans.find((plan) => !plan.completed) ?? null, [data]);
  const currentTemplate = useMemo(
    () => data?.route.find((template) => template.planCode === currentPlan?.planCode) ?? null,
    [currentPlan, data],
  );
  const otherPlans = useMemo(
    () => data?.route.filter((template) => template.planCode !== currentPlan?.planCode) ?? [],
    [currentPlan, data],
  );

  return (
    <AppShell active="plans">
      {!data && !error ? <LoadingState label="Loading your plans…" /> : null}
      {!data && error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {data ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#e5951d" />}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Plans</Text>
              <Text style={styles.subtitle}>Stay consistent with God’s Word through intentional reading plans.</Text>
            </View>
            <HeaderActions />
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Current Plan</Text><Text style={styles.link}>View All  ›</Text></View>

          {data.needsOnboarding ? (
            <Pressable onPress={() => router.push('/onboarding')} style={styles.emptyCard}>
              <View style={styles.emptyIcon}><MaterialCommunityIcons name="map-marker-path" size={28} color="#d68108" /></View>
              <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>Let’s build your reading route</Text><Text style={styles.emptyText}>Complete the short onboarding to begin.</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={25} color="#66707d" />
            </Pressable>
          ) : currentPlan ? (
            <View style={styles.currentCard}>
              <View style={styles.currentTop}>
                <Image source={cover} style={styles.currentCover} contentFit="cover" />
                <View style={styles.currentCopy}>
                  <Text style={styles.currentName}>{currentPlan.name}</Text>
                  <Text style={styles.books}>{currentTemplate?.bookNames || 'Your personalized route'}</Text>
                  <Text numberOfLines={3} style={styles.description}>{currentTemplate?.description || 'Continue growing through today’s reading and reflection.'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#68717d" />
                <Text style={styles.dayText}>Day {data.todayTask?.dayNumber ?? currentPlan.completedDays} of {currentPlan.totalDays}</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(1, currentPlan.completionPercentage)}%` }]} /></View>
                <Text style={styles.percent}>{Math.round(currentPlan.completionPercentage)}%</Text>
              </View>
              <Pressable
                disabled={!data.todayTask}
                onPress={() => router.push('/devotional')}
                style={[styles.continueButton, !data.todayTask && styles.disabled]}
              >
                <MaterialCommunityIcons name="book-open-outline" size={22} color="#df8500" />
                <Text style={styles.continueText}>{data.todayTask ? 'Continue Plan' : 'Reading Locked'}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#df8500" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyCard}><MaterialCommunityIcons name="check-decagram-outline" size={33} color="#d68108" /><View style={styles.emptyCopy}><Text style={styles.emptyTitle}>Your route is complete</Text><Text style={styles.emptyText}>You’ve completed every plan assigned to you.</Text></View></View>
          )}

          {!data.needsOnboarding ? (
            <>
              <Text style={[styles.sectionTitle, styles.allPlansTitle]}>All Plans</Text>
              <View style={styles.list}>
                {otherPlans.map((template, index) => (
                  <View key={template.planCode} style={styles.planCard}>
                    <Image source={cover} style={[styles.planCover, { opacity: 1 - index * 0.1 }]} contentFit="cover" />
                    <View style={styles.planCopy}>
                      <Text style={styles.planTitle}>{template.name}</Text>
                      <Text numberOfLines={1} style={styles.planSubtitle}>{template.description}</Text>
                      <View style={styles.meta}><MaterialCommunityIcons name="calendar-month-outline" size={18} color="#68717d" /><Text style={styles.metaText}>{template.durationDays} days  •  {template.bookNames}</Text></View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={28} color="#2c343d" />
                  </View>
                ))}
              </View>
              <View style={styles.comingSoon}>
                <View style={styles.gift}><MaterialCommunityIcons name="gift-outline" size={25} color="#66707d" /></View>
                <View><Text style={styles.comingTitle}>More plans coming soon</Text><Text style={styles.comingText}>New plans will be revealed as you progress.</Text></View>
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 23, paddingBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: '#111820', fontFamily: 'serif', fontSize: 38, lineHeight: 46, fontWeight: '700' },
  subtitle: { marginTop: 8, maxWidth: 275, color: '#707988', fontSize: 15, lineHeight: 23 },
  sectionHeader: { marginTop: 32, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#121820', fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  link: { color: '#db8100', fontSize: 14, fontWeight: '600' },
  currentCard: { padding: 15, borderWidth: 1, borderColor: '#eee1d3', borderRadius: 17, backgroundColor: '#fffdfa' },
  currentTop: { flexDirection: 'row' },
  currentCover: { width: 82, height: 116, borderRadius: 12 },
  currentCopy: { flex: 1, marginLeft: 17 },
  currentName: { color: '#121820', fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  books: { marginTop: 7, color: '#707989', fontSize: 13 },
  description: { marginTop: 10, color: '#636d7c', fontSize: 12, lineHeight: 19 },
  divider: { height: 1, marginVertical: 15, backgroundColor: '#e7e7e7' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayText: { color: '#697280', fontSize: 12 },
  progressTrack: { flex: 1, height: 6, overflow: 'hidden', borderRadius: 4, backgroundColor: '#e9eaec' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#ed9412' },
  percent: { color: '#68717d', fontSize: 12 },
  continueButton: { height: 48, marginTop: 15, borderWidth: 1, borderColor: '#efd8b7', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#fff' },
  continueText: { color: '#df8500', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.48 },
  allPlansTitle: { marginTop: 30, marginBottom: 15 },
  list: { gap: 11 },
  planCard: { minHeight: 111, padding: 13, borderWidth: 1, borderColor: '#e4e7ea', borderRadius: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  planCover: { width: 67, height: 84, borderRadius: 10 },
  planCopy: { flex: 1, marginLeft: 15, marginRight: 7 },
  planTitle: { color: '#121820', fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  planSubtitle: { marginTop: 7, color: '#697382', fontSize: 12 },
  meta: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { flex: 1, color: '#697382', fontSize: 10.5 },
  comingSoon: { minHeight: 78, marginTop: 13, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e8eaed', borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fafafa' },
  gift: { width: 45, height: 45, borderWidth: 1, borderColor: '#e1e4e7', borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  comingTitle: { color: '#1b222a', fontSize: 14, fontWeight: '600' },
  comingText: { marginTop: 4, color: '#7b838d', fontSize: 11 },
  emptyCard: { minHeight: 102, padding: 17, borderWidth: 1, borderColor: '#e7e2da', borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf3' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3df' },
  emptyCopy: { flex: 1, marginHorizontal: 13 }, emptyTitle: { fontSize: 15, fontWeight: '700' }, emptyText: { marginTop: 4, color: '#737c87', fontSize: 12 },
});
