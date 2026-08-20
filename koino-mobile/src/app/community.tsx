import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/app/Typography';

import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import { VersePickerModal } from '@/components/community/VersePickerModal';
import { addCommunityComment, blockCommunityUser, createCommunityPhotoPost, createCommunityPost, getBibleBooks, getCommunityPosts, getCurrentUser, reportCommunityPost } from '@/features/community/communityService';
import type { ReportReason } from '@/components/community/ReportModal';
import type { BibleBook, CommunityPost, CommunityPostType, CommunityVerse, CurrentUser } from '@/features/community/types';
import { router } from 'expo-router';
import { layout } from '@/theme/layout';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { Toast, type ToastMessage } from '@/components/app/Toast';

export default function CommunityScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const filters: { label: string; value: CommunityPostType | 'ALL' }[] = pt ? [{ label: 'Para si', value: 'ALL' }, { label: 'Versículos', value: 'VERSE' }, { label: 'Perguntas', value: 'QUESTION' }, { label: 'Fotos', value: 'PHOTO' }] : [{ label: 'For You', value: 'ALL' }, { label: 'Verses', value: 'VERSE' }, { label: 'Questions', value: 'QUESTION' }, { label: 'Photos', value: 'PHOTO' }];
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [filter, setFilter] = useState<CommunityPostType | 'ALL'>('ALL');
  const [mode, setMode] = useState<CommunityPostType>('QUESTION');
  const [content, setContent] = useState('');
  const [verse, setVerse] = useState<CommunityVerse | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [versePickerOpen, setVersePickerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentingId, setCommentingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError('');
    try {
      const [nextPosts, currentUser, bibleBooks] = await Promise.all([getCommunityPosts(filter), getCurrentUser(), getBibleBooks()]);
      setPosts(nextPosts); setUser(currentUser); setBooks(bibleBooks);
    } catch (failure) { setError(failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar a comunidade.' : 'Unable to load the community.'); }
    finally { setRefreshing(false); }
  }, [filter, pt]);

  useEffect(() => { load(); }, [load]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setToast({ id: Date.now(), tone: 'error', text: pt ? 'Permita o acesso às fotos para partilhar uma imagem.' : 'Allow photo access to share an image with the community.' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.72 });
    if (!result.canceled) setPhoto(result.assets[0]);
  }

  const canPost = !posting && (mode === 'QUESTION' ? Boolean(content.trim()) : mode === 'VERSE' ? Boolean(verse) : Boolean(photo));

  async function submitPost() {
    if (!canPost) return;
    setPosting(true); setError('');
    try {
      const created = mode === 'PHOTO' && photo
        ? await createCommunityPhotoPost(photo.uri, photo.mimeType ?? null, photo.fileName ?? null, content)
        : await createCommunityPost(mode, content, verse?.verseId ?? null);
      setFilter('ALL'); setPosts((current) => [created, ...(current ?? []).filter((item) => item.postId !== created.postId)]);
      setContent(''); setPhoto(null); setVerse(null);
      setToast({ id: Date.now(), tone: 'success', text: pt ? 'Publicação criada.' : 'Post published.' });
    } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível publicar.' : 'Unable to publish this post.' }); }
    finally { setPosting(false); }
  }

  async function addComment(postId: number, comment: string) {
    setCommentingId(postId);
    try {
      const saved = await addCommunityComment(postId, comment);
      setPosts((current) => current?.map((post) => post.postId === postId ? { ...post, comments: [...post.comments, saved] } : post) ?? null);
      return true;
    } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível comentar.' : 'Unable to post this comment.' }); return false; }
    finally { setCommentingId(null); }
  }

  async function reportPost(postId: number, reason: ReportReason, details: string) {
    try { await reportCommunityPost(postId, reason, details); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Obrigado. A publicação foi enviada para análise.' : 'Thank you. The post was sent for review.' }); return true; }
    catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível enviar a denúncia.' : 'Unable to submit this report.' }); return false; }
  }

  async function blockUser(userId: number) {
    try { await blockCommunityUser(userId); setPosts((current) => current?.filter((post) => post.author.userId !== userId) ?? null); setToast({ id: Date.now(), tone: 'success', text: pt ? 'Utilizador bloqueado. O conteúdo foi ocultado.' : 'User blocked. Their content is now hidden.' }); return true; }
    catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível bloquear este utilizador.' : 'Unable to block this user.' }); return false; }
  }

  return (
    <AppShell active="community">
      {!posts && !error ? <LoadingState label={pt ? 'A abrir a comunidade…' : 'Opening the community…'} /> : null}
      {!posts && error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {posts && user ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#e59010" />}>
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.title}>{pt ? 'Comunidade' : 'Community'}</Text><Text style={styles.subtitle}>{pt ? 'Partilhe a Palavra, faça perguntas e encoraje outros.' : 'Share Scripture, ask questions, and encourage one another.'}</Text></View>
            <Pressable accessibilityLabel={pt ? 'Abrir conversas' : 'Open chats'} onPress={() => router.push('/chat')} style={styles.headerAction}><Ionicons name="chatbubbles-outline" size={21} color="#27313d" /></Pressable>
          </View>

          <View style={styles.composer}>
            <View style={styles.composerTop}>
              <Avatar name={user.fullname} uri={user.profilePictureUrl} size={49} />
              <TextInput value={content} onChangeText={setContent} maxLength={1200} multiline placeholder={pt ? (mode === 'QUESTION' ? 'O que deseja perguntar?' : mode === 'PHOTO' ? 'Adicione uma legenda…' : 'Partilhe uma reflexão…') : (mode === 'QUESTION' ? 'What would you like to ask?' : mode === 'PHOTO' ? 'Add a caption…' : 'Add a thought about this verse…')} placeholderTextColor="#969daa" style={styles.input} />
              <Pressable disabled={!canPost} onPress={submitPost} style={[styles.postButton, !canPost && styles.postDisabled]}>{posting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.postText, !canPost && styles.postTextDisabled]}>{pt ? 'Publicar' : 'Post'}</Text>}</Pressable>
            </View>
            {verse ? <Pressable onPress={() => setVersePickerOpen(true)} style={styles.versePreview}><Text style={styles.previewRef}>{verse.reference}</Text><Text numberOfLines={2} style={styles.previewText}>“{verse.text}”</Text></Pressable> : null}
            {photo ? <View style={styles.photoPreview}><Image source={{ uri: photo.uri }} style={styles.previewImage} contentFit="cover" /><Pressable onPress={() => setPhoto(null)} style={styles.removePhoto}><Ionicons name="close" size={19} color="#111820" /></Pressable></View> : null}
            <View style={styles.composerDivider} />
            <View style={styles.modes}>
              <Pressable onPress={() => { setMode('VERSE'); setVersePickerOpen(true); }} style={[styles.mode, mode === 'VERSE' && styles.modeActive]}><Ionicons name="book-outline" size={21} color={mode === 'VERSE' ? '#a86508' : '#526071'} /><Text style={[styles.modeText, mode === 'VERSE' && styles.modeTextActive]}>{pt ? 'Versículo' : 'Verse'}</Text></Pressable>
              <Pressable onPress={() => { setMode('PHOTO'); pickPhoto(); }} style={[styles.mode, mode === 'PHOTO' && styles.modeActive]}><Ionicons name="image-outline" size={21} color={mode === 'PHOTO' ? '#a86508' : '#526071'} /><Text style={[styles.modeText, mode === 'PHOTO' && styles.modeTextActive]}>{pt ? 'Foto' : 'Photo'}</Text></Pressable>
              <Pressable onPress={() => setMode('QUESTION')} style={[styles.mode, mode === 'QUESTION' && styles.modeActive]}><Ionicons name="help-circle-outline" size={21} color={mode === 'QUESTION' ? '#a86508' : '#526071'} /><Text style={[styles.modeText, mode === 'QUESTION' && styles.modeTextActive]}>{pt ? 'Pergunta' : 'Question'}</Text></Pressable>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {filters.map((item) => <Pressable key={item.value} onPress={() => { setFilter(item.value); setPosts(null); }} style={[styles.filter, filter === item.value && styles.filterActive]}><Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.feed}>
            {posts.length ? posts.map((post) => <CommunityPostCard key={post.postId} post={post} currentUserId={user.userId} commenting={commentingId === post.postId} onComment={addComment} onReport={reportPost} onBlock={blockUser} onAuthorPress={(userId) => router.push({ pathname: '/profile/[userId]', params: { userId: String(userId) } })} />) : <View style={styles.empty}><Ionicons name="chatbubble-ellipses-outline" size={35} color="#d68108" /><Text style={styles.emptyTitle}>{pt ? 'Comece a conversa' : 'Start the conversation'}</Text><Text style={styles.emptyText}>{pt ? 'Partilhe um versículo, foto ou pergunta.' : 'Share a verse, photo, or question with the community.'}</Text></View>}
          </View>
          {error ? <Pressable onPress={() => setError('')}><Text style={styles.error}>{error}</Text></Pressable> : null}
          <VersePickerModal visible={versePickerOpen} books={books} onClose={() => setVersePickerOpen(false)} onSelect={(selected) => { setVerse(selected); setMode('VERSE'); }} />
        </ScrollView>
      ) : null}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingTop: layout.screenTop, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, headerCopy: { flex: 1 },
  title: { color: '#111820', fontSize: layout.titleSize, lineHeight: 37, fontWeight: '800' }, subtitle: { marginTop: 4, maxWidth: 280, color: '#6d7787', fontSize: 13, lineHeight: 19 },
  headerAction: { width: 42, height: 42, borderWidth: 1, borderColor: '#e4e7ea', borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  composer: { marginTop: 18, padding: 12, borderWidth: 1, borderColor: '#dde1e5', borderRadius: 14, backgroundColor: '#fff' },
  composerTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, input: { flex: 1, minHeight: 46, maxHeight: 96, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#d9dee4', borderRadius: 12, color: '#202831', backgroundColor: '#fff', fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  postButton: { minWidth: 78, height: 42, paddingHorizontal: 12, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e29624' }, postDisabled: { backgroundColor: '#f4ede4' }, postText: { color: '#fff', fontSize: 13, fontWeight: '700' }, postTextDisabled: { color: '#9299a3' },
  composerDivider: { height: 1, marginTop: 12, backgroundColor: '#eceef0' }, modes: { paddingTop: 9, flexDirection: 'row', gap: 5 },
  mode: { flex: 1, minHeight: 42, paddingHorizontal: 7, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, modeActive: { backgroundColor: '#fff6ea' }, modeText: { color: '#526071', fontSize: 12, fontWeight: '600' }, modeTextActive: { color: '#a86508' },
  versePreview: { marginTop: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#e99516', borderRadius: 8, backgroundColor: '#fffaf3' }, previewRef: { color: '#9f6309', fontSize: 12, fontWeight: '700' }, previewText: { marginTop: 5, color: '#4b5663', fontSize: 12, lineHeight: 18 },
  photoPreview: { position: 'relative', marginTop: 12 }, previewImage: { width: '100%', height: 180, borderRadius: 10 }, removePhoto: { position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  filters: { marginTop: 22, borderBottomWidth: 1, borderBottomColor: '#e1e4e7' }, filter: { height: 47, marginRight: 19, paddingHorizontal: 7, justifyContent: 'center' }, filterActive: { borderBottomWidth: 3, borderBottomColor: '#eb920f' }, filterText: { color: '#596575', fontSize: 14, fontWeight: '500' }, filterTextActive: { color: '#d98000', fontWeight: '700' },
  feed: { marginTop: 14, gap: 13 }, empty: { minHeight: 230, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: '700' }, emptyText: { marginTop: 6, color: '#747d89', fontSize: 13, textAlign: 'center' },
  error: { marginTop: 13, padding: 10, borderRadius: 9, color: '#5f6977', fontSize: 12, textAlign: 'center', backgroundColor: '#f4f5f6' },
});
