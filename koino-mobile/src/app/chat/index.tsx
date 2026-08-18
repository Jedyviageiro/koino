import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { getChatFriends } from '@/features/chat/chatService';
import type { ChatFriend } from '@/features/chat/types';

function conversationTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 3600000) return `${Math.max(1, Math.floor(elapsed / 60000))}m`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h`;
  if (elapsed < 604800000) return `${Math.floor(elapsed / 86400000)}d`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

export default function ChatListScreen() {
  const [friends, setFriends] = useState<ChatFriend[] | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError('');
    try { setFriends(await getChatFriends()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load your conversations.'); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => getChatFriends().then(setFriends).catch(() => {}), 10000);
    return () => clearInterval(interval);
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? (friends ?? []).filter((friend) => `${friend.fullname} ${friend.username}`.toLowerCase().includes(needle)) : friends ?? [];
  }, [friends, query]);

  return (
    <AppShell active="chat">
      {!friends && !error ? <LoadingState label="Loading your conversations…" /> : null}
      {!friends && error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {friends ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#2a68f5" />}>
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.title}>Chat</Text><Text style={styles.subtitle}>Private conversations with your Koino friends.</Text></View>
          </View>
          <View style={styles.search}><TextInput value={query} onChangeText={setQuery} placeholder="Filter conversations" placeholderTextColor="#778294" style={styles.searchInput} /></View>
          <View style={styles.list}>
            {visible.map((friend) => (
              <Pressable key={friend.userId} onPress={() => router.push({ pathname: '/chat/[friendId]', params: { friendId: String(friend.userId) } })} style={styles.friend}>
                <View><Avatar name={friend.fullname} uri={friend.profilePictureUrl} size={61} />{friend.unreadCount > 0 ? <View style={styles.onlineDot} /> : null}</View>
                <View style={styles.friendCopy}>
                  <Text style={styles.friendName}>{friend.fullname}</Text>
                  <Text numberOfLines={2} style={[styles.lastMessage, friend.unreadCount > 0 && styles.unreadMessage]}>{friend.lastMessage || 'Message your new friend…'}</Text>
                </View>
                <View style={styles.friendTail}><Text style={styles.time}>{conversationTime(friend.lastMessageAt)}</Text>{friend.unreadCount > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadCount}>{friend.unreadCount}</Text></View> : <MaterialCommunityIcons name="chevron-right" size={28} color="#747e8e" />}</View>
              </Pressable>
            ))}
            {!visible.length ? <View style={styles.empty}><MaterialCommunityIcons name="message-outline" size={38} color="#2d69f4" /><Text style={styles.emptyTitle}>{query ? 'No friends found' : 'No conversations yet'}</Text><Text style={styles.emptyText}>{query ? 'Try another name or username.' : 'Add Koino friends to start a private conversation.'}</Text></View> : null}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 23, paddingBottom: 25 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9 }, headerCopy: { flex: 1 },
  title: { color: '#111820', fontFamily: 'serif', fontSize: 38, lineHeight: 46, fontWeight: '700' }, subtitle: { marginTop: 6, color: '#6d7787', fontSize: 14, lineHeight: 21 },
  search: { height: 57, marginTop: 28, paddingHorizontal: 17, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f7f7f7' }, searchInput: { flex: 1, height: '100%', color: '#18212b', fontSize: 15 },
  list: { marginTop: 20 },
  friend: { minHeight: 105, paddingHorizontal: 6, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eceef0', flexDirection: 'row', alignItems: 'center' },
  onlineDot: { position: 'absolute', right: -1, bottom: 2, width: 17, height: 17, borderRadius: 9, borderWidth: 3, borderColor: '#fff', backgroundColor: '#326cf4' },
  friendCopy: { flex: 1, marginLeft: 17 }, friendName: { color: '#101820', fontSize: 18, fontWeight: '700' }, lastMessage: { marginTop: 7, color: '#717c8d', fontSize: 14, lineHeight: 20 }, unreadMessage: { color: '#303a48', fontWeight: '600' },
  friendTail: { minWidth: 38, marginLeft: 7, alignItems: 'center', gap: 8 }, time: { color: '#6f798a', fontSize: 12 }, unreadBadge: { minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2c69f3' }, unreadCount: { color: '#fff', fontSize: 10, fontWeight: '700' },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 14, color: '#172029', fontSize: 18, fontWeight: '700' }, emptyText: { marginTop: 7, maxWidth: 280, color: '#76808e', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  error: { marginTop: 12, padding: 10, borderRadius: 10, color: '#a33a34', backgroundColor: '#fff0ef', textAlign: 'center' },
});
