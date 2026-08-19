import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { getAuthSession } from '@/features/auth/authStorage';
import { getChatFriends, getChatTyping, getConversation, sendChatMessage, setChatTyping } from '@/features/chat/chatService';
import type { ChatFriend, ChatMessage } from '@/features/chat/types';

function messageTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ friendId?: string | string[] }>();
  const friendId = Number(Array.isArray(params.friendId) ? params.friendId[0] : params.friendId);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [friend, setFriend] = useState<ChatFriend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [friendTyping, setFriendTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!Number.isFinite(friendId) || friendId <= 0) {
      setError('This conversation link is invalid.');
      return;
    }
    setError('');
    try {
      const [friends, conversation, session] = await Promise.all([getChatFriends(), getConversation(friendId), getAuthSession()]);
      setFriend(friends.find((item) => item.userId === friendId) ?? null);
      setMessages(conversation);
      setCurrentUserId(session?.id ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open this conversation.');
    }
  }, [friendId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!Number.isFinite(friendId) || friendId <= 0) return;
    const interval = setInterval(() => {
      Promise.all([getConversation(friendId), getChatTyping(friendId)])
        .then(([conversation, typing]) => { setMessages(conversation); setFriendTyping(typing.typing); })
        .catch(() => {});
    }, 1800);
    return () => clearInterval(interval);
  }, [friendId]);

  useEffect(() => {
    if (!Number.isFinite(friendId) || friendId <= 0) return;
    const typing = draft.trim().length > 0;
    setChatTyping(friendId, typing).catch(() => {});
    if (!typing) return;
    const interval = setInterval(() => setChatTyping(friendId, true).catch(() => {}), 2500);
    return () => { clearInterval(interval); setChatTyping(friendId, false).catch(() => {}); };
  }, [draft, friendId]);

  const orderedMessages = useMemo(
    () => [...(messages ?? [])].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
    [messages],
  );

  async function send() {
    const body = draft.trim();
    if (!body || sending || !Number.isFinite(friendId)) return;
    setSending(true);
    setError('');
    setDraft('');
    try {
      const message = await sendChatMessage(friendId, body);
      setMessages((current) => [...(current ?? []), message]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (failure) {
      setDraft(body);
      setError(failure instanceof Error ? failure.message : 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  if (!messages && !error) return <AppShell active="chat"><LoadingState label="Opening conversation..." /></AppShell>;
  if (!messages && error) return <AppShell active="chat"><ErrorState message={error} onRetry={load} /></AppShell>;

  return (
    <AppShell active="chat">
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back to chat list" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={25} color="#637083" /></Pressable>
          <Avatar name={friend?.fullname ?? 'Koino friend'} uri={friend?.profilePictureUrl} size={52} />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.friendName}>{friend?.fullname ?? 'Koino friend'}</Text>
            <Text style={[styles.presence, friendTyping && styles.typing]}>{friendTyping ? 'Typing...' : 'Koino friend'}</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={orderedMessages}
          keyExtractor={(item) => String(item.messageId)}
          contentContainerStyle={[styles.messages, !orderedMessages.length && styles.emptyMessages]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={orderedMessages.length ? <Text style={styles.dayLabel}>Today</Text> : null}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubble-ellipses-outline" size={38} color="#2d69f4" /><Text style={styles.emptyTitle}>Start the conversation</Text><Text style={styles.emptyText}>Send an encouraging message to your Koino friend.</Text></View>}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.messageRow, mine && styles.myMessageRow]}>
                {!mine ? <Avatar name={friend?.fullname ?? 'Friend'} uri={friend?.profilePictureUrl} size={36} /> : null}
                <View style={[styles.messageGroup, mine && styles.myMessageGroup]}>
                  <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}><Text style={[styles.messageBody, mine && styles.myMessageBody]}>{item.body}</Text></View>
                  <View style={[styles.messageMeta, mine && styles.myMessageMeta]}><Text style={styles.messageTime}>{messageTime(item.sentAt)}</Text>{mine ? <Ionicons name={item.readAt ? 'checkmark-done' : 'checkmark'} size={17} color="#2c69f3" /> : null}</View>
                </View>
              </View>
            );
          }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.composer}>
          <Pressable accessibilityLabel="Add attachment" style={styles.addButton}><Ionicons name="add" size={26} color="#647184" /></Pressable>
          <View style={styles.inputWrap}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" placeholder="Type a message..." placeholderTextColor="#778294" multiline style={styles.input} /></View>
          <Pressable accessibilityLabel="Send message" disabled={!draft.trim() || sending} onPress={send} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled, pressed && styles.pressed]}><Ionicons name="send" size={21} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eceef0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 31, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 }, friendName: { color: '#111820', fontSize: 18, fontWeight: '700' }, presence: { marginTop: 3, color: '#707b8d', fontSize: 13 }, typing: { color: '#2c69f3' },
  messages: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 20 }, emptyMessages: { flexGrow: 1 }, dayLabel: { marginBottom: 25, color: '#738095', fontSize: 13, textAlign: 'center' },
  messageRow: { marginBottom: 17, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }, myMessageRow: { justifyContent: 'flex-end' }, messageGroup: { maxWidth: '78%', alignItems: 'flex-start' }, myMessageGroup: { alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 19 }, theirBubble: { backgroundColor: '#f2f3f5', borderBottomLeftRadius: 5 }, myBubble: { backgroundColor: '#2b68f3', borderBottomRightRadius: 5 }, messageBody: { color: '#1e2b41', fontSize: 16, lineHeight: 23 }, myMessageBody: { color: '#fff' },
  messageMeta: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }, myMessageMeta: { justifyContent: 'flex-end' }, messageTime: { color: '#788397', fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 13, color: '#172029', fontSize: 18, fontWeight: '700' }, emptyText: { marginTop: 7, maxWidth: 260, color: '#76808e', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { marginHorizontal: 15, marginBottom: 7, padding: 8, borderRadius: 9, color: '#a33a34', backgroundColor: '#fff0ef', fontSize: 12, textAlign: 'center' },
  composer: { paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eceef0', flexDirection: 'row', alignItems: 'flex-end', gap: 9, backgroundColor: '#fff' },
  addButton: { width: 40, height: 40, borderWidth: 1.5, borderColor: '#778294', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, inputWrap: { flex: 1, minHeight: 43, maxHeight: 104, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e1e5ea', borderRadius: 23, justifyContent: 'center' }, input: { maxHeight: 92, paddingVertical: 9, color: '#17202b', fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2b69f4' }, sendDisabled: { opacity: 0.45 }, pressed: { opacity: 0.7 },
});
