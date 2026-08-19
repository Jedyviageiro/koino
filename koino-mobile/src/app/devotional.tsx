import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { getDevotionalData } from '@/features/app/appService';
import type { DevotionalData } from '@/features/app/types';
import { getAuthSession } from '@/features/auth/authStorage';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { localizedBibleReference } from '@/features/localization/bibleBooks';

const cover = require('../../assets/images/plans-cover.png');

export default function DevotionalScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [data, setData] = useState<DevotionalData | null>(null);
  const [firstName, setFirstName] = useState('there');
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [result, session] = await Promise.all([getDevotionalData(), getAuthSession()]);
      if (!result.task || !result.devotional) throw new Error(pt ? 'Ainda não há devocional disponível para hoje.' : 'There is no devotional available for today yet.');
      setData(result);
      setFirstName(session?.fullname?.trim().split(/\s+/)[0] || (pt ? 'amigo' : 'there'));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível preparar o devocional.' : 'Unable to prepare today’s devotional.');
    }
  }, [pt]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell active="plans">
      {!data && !error ? <LoadingState label={pt ? 'A preparar o devocional de hoje…' : 'Preparing today’s devotional…'} /> : null}
      {!data && error ? <ErrorState message={error} onRetry={load} /> : null}
      {data?.task && data.devotional ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#626b78" /><Text style={styles.backText}>{pt ? 'Voltar aos planos' : 'Back to Plans'}</Text>
          </Pressable>

          <View style={styles.planHeader}>
            <View style={styles.planHeaderCopy}>
              <Text style={styles.planLabel}>{data.plan?.name ?? (pt ? 'Plano de hoje' : 'Today’s Plan')}</Text>
              <Text style={styles.dayTitle}>{pt ? 'Dia' : 'Day'} {data.task.dayNumber} {pt ? 'de' : 'of'} {data.plan?.totalDays ?? data.task.dayNumber}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <Image source={cover} style={styles.cover} contentFit="cover" />
            <View style={styles.progressCopy}>
              <Text style={styles.progressLabel}>{pt ? 'Seu progresso' : 'Your Progress'}</Text>
              <View style={styles.progressBarRow}>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(1, data.plan?.completionPercentage ?? 0)}%` }]} /></View>
                <Text style={styles.percent}>{Math.round(data.plan?.completionPercentage ?? 0)}%</Text>
              </View>
              <View style={styles.progressMeta}>
                <View style={styles.metaItem}><MaterialCommunityIcons name="clock-outline" size={21} color="#172029" /><Text style={styles.metaText}>~{data.task.estimatedMinutes} {pt ? 'min de leitura' : 'min read'}</Text></View>
                <View style={styles.metaItem}><MaterialCommunityIcons name="text-box-outline" size={20} color="#172029" /><Text style={styles.metaText}>{data.devotional.verseCount} {pt ? 'versículos' : 'verses'}</Text></View>
              </View>
            </View>
          </View>

          <Text style={styles.eyebrow}>{pt ? 'Devocional de hoje' : 'Today’s Devotional'}</Text>
          <Text style={styles.title}>{data.devotional.title}</Text>
          <View style={styles.anchor}>
            <Text style={styles.anchorText}>{data.devotional.anchorVerseText}</Text>
            <Text style={styles.anchorReference}>{localizedBibleReference(data.devotional.anchorVerseReference, language)}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.paragraph}>{pt ? 'Olá' : 'Hi'} {firstName},</Text>
            <Text style={styles.paragraph}>{data.devotional.opening}</Text>
            <Text numberOfLines={expanded ? undefined : 8} style={styles.paragraph}>{data.devotional.reflection}</Text>
            {expanded ? <Text style={styles.paragraph}>{data.devotional.application}</Text> : null}
          </View>
          <Pressable onPress={() => setExpanded((current) => !current)} style={styles.readMore}>
            <Text style={styles.readMoreText}>{pt ? (expanded ? 'Mostrar menos' : 'Ler mais') : (expanded ? 'Show Less' : 'Read More')}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={21} color="#d58100" />
          </Pressable>

          <View style={styles.prayerCard}>
            <View style={styles.prayerIcon}><MaterialCommunityIcons name="heart-outline" size={24} color="#de8500" /></View>
            <View style={styles.prayerCopy}><Text style={styles.prayerTitle}>{pt ? 'Vamos orar' : 'Let’s Pray'}</Text><Text style={styles.prayerText}>{data.devotional.prayer}</Text></View>
          </View>

          <View style={styles.readingCta}>
            <View style={styles.readingIcon}><MaterialCommunityIcons name="book-open-outline" size={25} color="#dc8400" /></View>
            <View style={styles.readingCopy}><Text style={styles.readingTitle}>{pt ? 'Pronto para começar a leitura?' : 'Ready to begin today’s reading?'}</Text><Text style={styles.readingText}>{localizedBibleReference(data.task.readingAssignment, language)}  •  {data.devotional.verseCount} {pt ? 'versículos' : 'verses'}</Text></View>
            <Pressable onPress={() => router.push('/reading')} style={styles.startButton}><Text style={styles.startText}>{pt ? 'Começar' : 'Start Reading'}</Text><MaterialCommunityIcons name="chevron-right" size={22} color="#fff" /></Pressable>
          </View>
        </ScrollView>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 26 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingVertical: 7 },
  backText: { color: '#626b78', fontSize: 14, fontWeight: '600' },
  planHeader: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planHeaderCopy: { flex: 1 },
  planLabel: { color: '#d57f00', fontSize: 14, fontWeight: '600' },
  dayTitle: { marginTop: 7, color: '#101820', fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 32 },
  books: { marginTop: 8, color: '#707987', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 9 },
  action: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#e8eaed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  progressCard: { marginTop: 24, padding: 15, borderWidth: 1, borderColor: '#eee0d1', borderRadius: 17, flexDirection: 'row', backgroundColor: '#fffdfa' },
  cover: { width: 82, height: 116, borderRadius: 12 },
  progressCopy: { flex: 1, marginLeft: 17, justifyContent: 'center' },
  progressLabel: { color: '#182028', fontSize: 14, fontWeight: '700' },
  progressBarRow: { marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e7e9eb' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#ed9412' },
  percent: { color: '#59626e', fontSize: 12 },
  progressMeta: { marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e8e8e8', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, metaText: { color: '#26303a', fontSize: 11 },
  eyebrow: { marginTop: 35, color: '#d58000', fontSize: 14, fontWeight: '600' },
  title: { marginTop: 15, color: '#101820', fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 32, lineHeight: 40 },
  anchor: { marginTop: 20, paddingLeft: 16, borderLeftWidth: 3, borderLeftColor: '#ed960f' },
  anchorText: { color: '#677181', fontSize: 14, lineHeight: 23 },
  anchorReference: { marginTop: 8, color: '#d68100', fontSize: 13, fontWeight: '600' },
  body: { marginTop: 27 },
  paragraph: { marginBottom: 17, color: '#202831', fontSize: 15, lineHeight: 26 },
  readMore: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  readMoreText: { color: '#d58100', fontSize: 13, fontWeight: '600' },
  prayerCard: { marginTop: 18, padding: 15, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 15, flexDirection: 'row', backgroundColor: '#fff' },
  prayerIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6e9' },
  prayerCopy: { flex: 1, marginLeft: 13 }, prayerTitle: { color: '#182028', fontSize: 14, fontWeight: '700' }, prayerText: { marginTop: 3, color: '#5f6978', fontSize: 12, lineHeight: 18 },
  readingCta: { marginTop: 14, padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7eb' },
  readingIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  readingCopy: { flex: 1, marginLeft: 12 }, readingTitle: { color: '#172029', fontSize: 12, fontWeight: '700' }, readingText: { marginTop: 4, color: '#707987', fontSize: 10 },
  startButton: { height: 46, paddingHorizontal: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e98f08' },
  startText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
