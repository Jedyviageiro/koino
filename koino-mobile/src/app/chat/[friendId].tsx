import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/app/Typography';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { getAuthSession } from '@/features/auth/authStorage';
import { getChatFriends, getChatTyping, getConversation, sendChatMessage, sendChatPhoto, setChatTyping } from '@/features/chat/chatService';
import type { ChatFriend, ChatMessage } from '@/features/chat/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { Toast, type ToastMessage } from '@/components/app/Toast';

function messageTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function lastSeenText(friend: ChatFriend | null, pt: boolean) {
  if (friend?.online) return pt ? 'Online' : 'Online';
  if (!friend?.lastSeenAt) return pt ? 'Offline' : 'Offline';
  const elapsed = Math.max(0, Date.now() - new Date(friend.lastSeenAt).getTime());
  if (elapsed < 60000) return pt ? 'Visto agora' : 'Last seen just now';
  if (elapsed < 3600000) return pt ? `Visto há ${Math.floor(elapsed / 60000)} min` : `Last seen ${Math.floor(elapsed / 60000)}m ago`;
  if (elapsed < 86400000) return pt ? `Visto há ${Math.floor(elapsed / 3600000)} h` : `Last seen ${Math.floor(elapsed / 3600000)}h ago`;
  const date = new Intl.DateTimeFormat(pt ? 'pt' : 'en', { month: 'short', day: 'numeric' }).format(new Date(friend.lastSeenAt));
  return pt ? `Visto em ${date}` : `Last seen ${date}`;
}

function TypingIndicator({ label }: { label: string }) {
  const dots = useRef([new Animated.Value(.25), new Animated.Value(.25), new Animated.Value(.25)]).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.stagger(140, dots.map((dot) => Animated.sequence([
      Animated.timing(dot, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(dot, { toValue: .25, duration: 220, useNativeDriver: true }),
    ]))));
    animation.start();
    return () => animation.stop();
  }, [dots]);
  return <View style={styles.typingRow}><Text style={[styles.presence, styles.typing]}>{label}</Text><View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [.25, 1], outputRange: [0, -2] }) }] }]} />)}</View></View>;
}

export default function ConversationScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const params = useLocalSearchParams<{ friendId?: string | string[] }>();
  const friendId = Number(Array.isArray(params.friendId) ? params.friendId[0] : params.friendId);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [friend, setFriend] = useState<ChatFriend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [friendTyping, setFriendTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(friendId) || friendId <= 0) {
      setError(pt ? 'Este link de conversa é inválido.' : 'This conversation link is invalid.');
      return;
    }
    setError('');
    try {
      const [friends, conversation, session] = await Promise.all([getChatFriends(), getConversation(friendId), getAuthSession()]);
      setFriend(friends.find((item) => item.userId === friendId) ?? null);
      setMessages(conversation);
      setCurrentUserId(session?.id ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível abrir a conversa.' : 'Unable to open this conversation.');
    }
  }, [friendId, pt]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!Number.isFinite(friendId) || friendId <= 0) return;
    const interval = setInterval(() => {
      Promise.all([getConversation(friendId), getChatTyping(friendId), getChatFriends()])
        .then(([conversation, typing, friends]) => { setMessages(conversation); setFriendTyping(typing.typing); setFriend(friends.find((item) => item.userId === friendId) ?? null); })
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
    if ((!body && !pendingPhoto) || sending || !Number.isFinite(friendId)) return;
    setSending(true);
    setDraft('');
    const photo = pendingPhoto; setPendingPhoto(null);
    try {
      const message = photo ? await sendChatPhoto(friendId, photo.uri, photo.mimeType ?? null, photo.fileName ?? null, body) : await sendChatMessage(friendId, body);
      setMessages((current) => [...(current ?? []), message]);
      setToast({ id: Date.now(), tone: 'success', text: pt ? 'Mensagem enviada.' : 'Message sent.' });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (failure) {
      setDraft(body); setPendingPhoto(photo);
      setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível enviar a mensagem.' : 'Your message could not be sent.' });
    } finally {
      setSending(false);
    }
  }

  async function choosePhoto() {
    if (sending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setToast({ id: Date.now(), tone: 'error', text: pt ? 'Permita o acesso às fotos para enviar uma imagem.' : 'Allow photo access to send an image.' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .72, allowsEditing: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { setToast({ id: Date.now(), tone: 'error', text: pt ? 'A foto deve ter no máximo 5 MB.' : 'The photo must be 5 MB or smaller.' }); return; }
    setPendingPhoto(asset);
  }

  if (!messages && !error) return <AppShell active="community"><LoadingState label={pt ? 'A abrir conversa…' : 'Opening conversation…'} /></AppShell>;
  if (!messages && error) return <AppShell active="community"><ErrorState message={error} onRetry={load} /></AppShell>;

  return (
    <AppShell active="community">
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={pt ? 'Voltar às conversas' : 'Back to chat list'} onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={25} color="#637083" /></Pressable>
          <Pressable accessibilityLabel={pt ? 'Abrir perfil' : 'Open profile'} disabled={!friend} onPress={() => router.push({ pathname: '/profile/[userId]', params: { userId: String(friendId) } })}><Avatar name={friend?.fullname ?? 'Koino friend'} uri={friend?.profilePictureUrl} size={52} /></Pressable>
          <Pressable disabled={!friend} onPress={() => router.push({ pathname: '/profile/[userId]', params: { userId: String(friendId) } })} style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.friendName}>{friend?.fullname ?? 'Koino friend'}</Text>
            {friendTyping ? <TypingIndicator label={pt ? 'A escrever' : 'Typing'} /> : <Text style={[styles.presence, friend?.online && styles.online]}>{lastSeenText(friend, pt)}</Text>}
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={orderedMessages}
          keyExtractor={(item) => String(item.messageId)}
          contentContainerStyle={[styles.messages, !orderedMessages.length && styles.emptyMessages]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={orderedMessages.length ? <Text style={styles.dayLabel}>{pt ? 'Hoje' : 'Today'}</Text> : null}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubble-ellipses-outline" size={38} color="#2d69f4" /><Text style={styles.emptyTitle}>{pt ? 'Comece a conversa' : 'Start the conversation'}</Text><Text style={styles.emptyText}>{pt ? 'Envie uma mensagem de encorajamento ao seu amigo.' : 'Send an encouraging message to your Koino friend.'}</Text></View>}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.messageRow, mine && styles.myMessageRow]}>
                {!mine ? <Avatar name={friend?.fullname ?? 'Friend'} uri={friend?.profilePictureUrl} size={36} /> : null}
                <View style={[styles.messageGroup, mine && styles.myMessageGroup]}>
                  <View style={[styles.bubble, item.photoUrl && styles.photoBubble, mine ? styles.myBubble : styles.theirBubble]}>{item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={styles.messagePhoto} contentFit="cover" transition={180} /> : null}{item.body ? <Text style={[styles.messageBody, mine && styles.myMessageBody, item.photoUrl && styles.caption]}>{item.body}</Text> : null}</View>
                  <View style={[styles.messageMeta, mine && styles.myMessageMeta]}><Text style={styles.messageTime}>{messageTime(item.sentAt, pt ? 'pt' : 'en')}</Text>{mine ? <Ionicons accessibilityLabel={item.readAt ? (pt ? 'Lida' : 'Read') : item.deliveredAt ? (pt ? 'Entregue' : 'Delivered') : (pt ? 'Enviada' : 'Sent')} name={item.readAt || item.deliveredAt ? 'checkmark-done' : 'checkmark'} size={17} color={item.readAt ? '#2c69f3' : '#8a94a3'} /> : null}</View>
                </View>
              </View>
            );
          }}
        />

        {pendingPhoto ? <View style={styles.photoPreview}><Image source={{ uri: pendingPhoto.uri }} style={styles.previewImage} contentFit="cover" /><View style={styles.previewCopy}><Text style={styles.previewTitle}>{pt ? 'Foto selecionada' : 'Photo selected'}</Text><Text style={styles.previewHint}>{pt ? 'Adicione uma legenda ou envie agora.' : 'Add a caption or send it now.'}</Text></View><Pressable accessibilityLabel={pt ? 'Remover foto' : 'Remove photo'} onPress={() => setPendingPhoto(null)} style={styles.removePreview}><Ionicons name="close" size={20} color="#344050" /></Pressable></View> : null}
        <View style={styles.composer}>
          <Pressable accessibilityLabel={pt ? 'Anexar foto' : 'Attach photo'} disabled={sending} onPress={choosePhoto} style={styles.addButton}><Ionicons name="image-outline" size={21} color="#59677a" /></Pressable>
          <View style={styles.inputWrap}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" placeholder={pt ? 'Escreva uma mensagem…' : 'Type a message…'} placeholderTextColor="#778294" multiline style={styles.input} /></View>
          <Pressable accessibilityLabel={pt ? 'Enviar mensagem' : 'Send message'} disabled={(!draft.trim() && !pendingPhoto) || sending} onPress={send} style={({ pressed }) => [styles.sendButton, ((!draft.trim() && !pendingPhoto) || sending) && styles.sendDisabled, pressed && styles.pressed]}><Ionicons name="send" size={21} color="#fff" /></Pressable>
        </View>
        <Toast message={toast} duration={3000} onDismiss={() => setToast(null)} />
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eceef0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 31, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 }, friendName: { color: '#111820', fontSize: 18, fontWeight: '700' }, presence: { marginTop: 3, color: '#707b8d', fontSize: 13 }, online: { color: '#16934d', fontWeight: '600' }, typing: { color: '#2c69f3' }, typingRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 5 }, typingDots: { paddingTop: 3, flexDirection: 'row', gap: 3 }, typingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2c69f3' },
  messages: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 20 }, emptyMessages: { flexGrow: 1 }, dayLabel: { marginBottom: 25, color: '#738095', fontSize: 13, textAlign: 'center' },
  messageRow: { marginBottom: 17, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }, myMessageRow: { justifyContent: 'flex-end' }, messageGroup: { maxWidth: '78%', alignItems: 'flex-start' }, myMessageGroup: { alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 19 }, photoBubble: { width: 230, overflow: 'hidden', padding: 4 }, theirBubble: { backgroundColor: '#f2f3f5', borderBottomLeftRadius: 5 }, myBubble: { backgroundColor: '#2b68f3', borderBottomRightRadius: 5 }, messagePhoto: { width: '100%', aspectRatio: 1.15, borderRadius: 15, backgroundColor: '#e8eaed' }, messageBody: { color: '#1e2b41', fontSize: 15, lineHeight: 22 }, myMessageBody: { color: '#fff' }, caption: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 5 },
  messageMeta: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }, myMessageMeta: { justifyContent: 'flex-end' }, messageTime: { color: '#788397', fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 13, color: '#172029', fontSize: 18, fontWeight: '700' }, emptyText: { marginTop: 7, maxWidth: 260, color: '#76808e', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { marginHorizontal: 15, marginBottom: 7, padding: 8, borderRadius: 9, color: '#a33a34', backgroundColor: '#fff0ef', fontSize: 12, textAlign: 'center' },
  photoPreview: { minHeight: 76, padding: 10, borderTopWidth: 1, borderTopColor: '#eceef0', flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fffaf2' }, previewImage: { width: 56, height: 56, borderRadius: 11 }, previewCopy: { flex: 1 }, previewTitle: { color: '#27313d', fontSize: 13, fontWeight: '700' }, previewHint: { marginTop: 2, color: '#737e8d', fontSize: 10 }, removePreview: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  composer: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eceef0', flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: '#fff' },
  addButton: { width: 43, height: 43, borderWidth: 1, borderColor: '#dfe3e8', borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8f9' }, inputWrap: { flex: 1, minHeight: 43, maxHeight: 104, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e1e5ea', borderRadius: 23, justifyContent: 'center' }, input: { maxHeight: 92, paddingVertical: 9, color: '#17202b', fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2b69f4' }, sendDisabled: { opacity: 0.45 }, pressed: { opacity: 0.7 },
});
