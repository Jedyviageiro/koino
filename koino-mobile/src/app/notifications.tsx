import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { acceptFriendRequest, getNotifications, markAllNotificationsRead, markNotificationRead, rejectFriendRequest } from '@/features/app/appService';
import type { Notification } from '@/features/app/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { Toast, type ToastMessage } from '@/components/app/Toast';
import { sendDeviceTestNotification } from '@/features/notifications/deviceNotifications';

export default function NotificationsScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const load = useCallback(async () => {
    setError('');
    try { setItems((await getNotifications()).filter((item) => item.type !== 'BATTLE_CHALLENGE')); }
    catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar as notificações.' : 'Unable to load notifications.'); }
  }, [pt]);

  useEffect(() => { load(); }, [load]);

  async function read(item: Notification) {
    try {
      if (!item.read) { await markNotificationRead(item.notificationId); setItems((current) => current?.map((entry) => entry.notificationId === item.notificationId ? { ...entry, read: true } : entry) ?? null); }
      if (item.type === 'PLAN_READY') router.push('/plans');
      if (item.type === 'READING_REMINDER') router.push('/devotional');
      if (item.type === 'CHAT_MESSAGE' && item.referenceId) router.push({ pathname: '/chat/[friendId]', params: { friendId: item.referenceId } });
    } catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível atualizar a notificação.' : 'Unable to update notification.'); }
  }

  async function respond(item: Notification, accept: boolean) {
    const friendshipId = Number(item.referenceId); if (!Number.isFinite(friendshipId)) return;
    setBusyId(item.notificationId);
    try { if (accept) await acceptFriendRequest(friendshipId); else await rejectFriendRequest(friendshipId); setItems((current) => current?.filter((entry) => entry.notificationId !== item.notificationId) ?? null); setToast({ id: Date.now(), tone: 'success', text: accept ? (pt ? 'Pedido de amizade aceite.' : 'Friend request accepted.') : (pt ? 'Pedido recusado.' : 'Friend request declined.') }); }
    catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível responder.' : 'Unable to respond.' }); }
    finally { setBusyId(null); }
  }

  async function readAll() {
    try { await markAllNotificationsRead(); setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível atualizar as notificações.' : 'Unable to update notifications.'); }
  }

  async function testPhoneNotification() {
    try {
      await sendDeviceTestNotification(pt);
      setToast({ id: Date.now(), tone: 'success', text: pt ? 'Notificação de teste enviada.' : 'Test notification sent.' });
    } catch (failure) {
      setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível testar a notificação.' : 'Unable to test notifications.' });
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={25} color="#56606d" /></Pressable>
        <Text style={styles.title}>{pt ? 'Notificações' : 'Notifications'}</Text>
        <Pressable disabled={!items?.some((item) => !item.read)} onPress={readAll}><Text style={styles.readAll}>{pt ? 'Ler todas' : 'Read all'}</Text></Pressable>
      </View>
      {!items && !error ? <LoadingState label={pt ? 'A carregar notificações…' : 'Loading notifications…'} /> : null}
      {!items && error ? <ErrorState message={error} onRetry={load} /> : null}
      {items ? (
        <ScrollView contentContainerStyle={styles.list}>
          <Pressable onPress={testPhoneNotification} style={styles.testNotification}><MaterialCommunityIcons name="cellphone-message" size={20} color="#c87400" /><View style={styles.testCopy}><Text style={styles.testTitle}>{pt ? 'Testar no telemóvel' : 'Test on this phone'}</Text><Text style={styles.testHint}>{pt ? 'Mostrar uma notificação do sistema agora' : 'Show a system notification now'}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color="#7d8793" /></Pressable>
          {items.length ? items.map((item) => (
            <Pressable key={item.notificationId} onPress={() => read(item)} style={[styles.item, !item.read && styles.unread]}>
              <View style={styles.icon}><MaterialCommunityIcons name={item.read ? 'bell-outline' : 'bell-ring-outline'} size={22} color="#d68108" /></View>
              <View style={styles.copy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.message}>{item.message}</Text>{item.type === 'FRIEND_REQUEST' && item.referenceId ? <View style={styles.requestActions}><Pressable disabled={busyId === item.notificationId} onPress={(event) => { event.stopPropagation(); respond(item, true); }} style={styles.accept}><Text style={styles.acceptText}>{pt ? 'Aceitar' : 'Accept'}</Text></Pressable><Pressable disabled={busyId === item.notificationId} onPress={(event) => { event.stopPropagation(); respond(item, false); }} style={styles.decline}><Text style={styles.declineText}>{pt ? 'Recusar' : 'Decline'}</Text></Pressable></View> : null}</View>
              {!item.read ? <View style={styles.dot} /> : null}
            </Pressable>
          )) : (
            <View style={styles.empty}><MaterialCommunityIcons name="bell-check-outline" size={38} color="#d68108" /><Text style={styles.emptyTitle}>{pt ? 'Está tudo em dia' : 'You’re all caught up'}</Text><Text style={styles.emptyText}>{pt ? 'Novas atualizações aparecerão aqui.' : 'New updates will appear here.'}</Text></View>
          )}
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        </ScrollView>
      ) : null}
      <Toast message={toast} duration={3500} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 70, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eceef0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#151c24', fontSize: 23, fontWeight: '800' },
  readAll: { color: '#d68108', fontSize: 12, fontWeight: '600' },
  list: { padding: 18, gap: 10 },
  testNotification: { minHeight: 68, marginBottom: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: '#efd9b8', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffaf2' },
  testCopy: { flex: 1 }, testTitle: { color: '#202932', fontSize: 13, fontWeight: '700' }, testHint: { marginTop: 3, color: '#77818d', fontSize: 11 },
  item: { minHeight: 86, padding: 14, borderWidth: 1, borderColor: '#e7e9eb', borderRadius: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  unread: { borderColor: '#efd7b4', backgroundColor: '#fff9f0' },
  icon: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3df' },
  copy: { flex: 1, marginLeft: 12 }, itemTitle: { color: '#172029', fontSize: 14, fontWeight: '700' }, message: { marginTop: 4, color: '#697382', fontSize: 12, lineHeight: 17 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ed9210' },
  empty: { paddingTop: 120, alignItems: 'center' }, emptyTitle: { marginTop: 15, fontSize: 18, fontWeight: '700' }, emptyText: { marginTop: 6, color: '#737c87', fontSize: 13 },
  inlineError: { color: '#aa3c34', fontSize: 12, textAlign: 'center' },
  requestActions: { marginTop: 10, flexDirection: 'row', gap: 8 }, accept: { minHeight: 36, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9900c' }, acceptText: { color: '#fff', fontSize: 12, fontWeight: '700' }, decline: { minHeight: 36, paddingHorizontal: 15, borderWidth: 1, borderColor: '#dfe3e7', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, declineText: { color: '#525e6c', fontSize: 12, fontWeight: '700' },
});
