import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/features/app/appService';
import type { Notification } from '@/features/app/types';

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setItems(await getNotifications()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load notifications.'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function read(item: Notification) {
    if (item.read) return;
    try {
      await markNotificationRead(item.notificationId);
      setItems((current) => current?.map((entry) => entry.notificationId === item.notificationId ? { ...entry, read: true } : entry) ?? null);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to update notification.'); }
  }

  async function readAll() {
    try { await markAllNotificationsRead(); setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to update notifications.'); }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={25} color="#56606d" /></Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={readAll}><Text style={styles.readAll}>Read all</Text></Pressable>
      </View>
      {!items && !error ? <LoadingState label="Loading notifications…" /> : null}
      {!items && error ? <ErrorState message={error} onRetry={load} /> : null}
      {items ? (
        <ScrollView contentContainerStyle={styles.list}>
          {items.length ? items.map((item) => (
            <Pressable key={item.notificationId} onPress={() => read(item)} style={[styles.item, !item.read && styles.unread]}>
              <View style={styles.icon}><MaterialCommunityIcons name={item.read ? 'bell-outline' : 'bell-ring-outline'} size={22} color="#d68108" /></View>
              <View style={styles.copy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.message}>{item.message}</Text></View>
              {!item.read ? <View style={styles.dot} /> : null}
            </Pressable>
          )) : (
            <View style={styles.empty}><MaterialCommunityIcons name="bell-check-outline" size={38} color="#d68108" /><Text style={styles.emptyTitle}>You’re all caught up</Text><Text style={styles.emptyText}>New updates will appear here.</Text></View>
          )}
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 70, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eceef0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#151c24', fontFamily: 'serif', fontSize: 23, fontWeight: '700' },
  readAll: { color: '#d68108', fontSize: 12, fontWeight: '600' },
  list: { padding: 18, gap: 10 },
  item: { minHeight: 86, padding: 14, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  unread: { borderColor: '#efd7b4', backgroundColor: '#fff9f0' },
  icon: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3df' },
  copy: { flex: 1, marginLeft: 12 }, itemTitle: { color: '#172029', fontSize: 14, fontWeight: '700' }, message: { marginTop: 4, color: '#697382', fontSize: 12, lineHeight: 17 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ed9210' },
  empty: { paddingTop: 120, alignItems: 'center' }, emptyTitle: { marginTop: 15, fontSize: 18, fontWeight: '700' }, emptyText: { marginTop: 6, color: '#737c87', fontSize: 13 },
  inlineError: { color: '#aa3c34', fontSize: 12, textAlign: 'center' },
});
