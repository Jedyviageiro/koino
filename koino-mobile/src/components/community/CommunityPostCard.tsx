import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CommunityPost } from '@/features/community/types';
import { Avatar } from './Avatar';

function relativeTime(value: string) {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function CommunityPostCard({ post, commenting, onComment }: { post: CommunityPost; commenting: boolean; onComment: (postId: number, content: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  async function submit() {
    if (!comment.trim() || commenting) return;
    if (await onComment(post.postId, comment)) { setComment(''); setOpen(true); }
  }
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={post.author.fullname} uri={post.author.profilePictureUrl} size={44} />
        <View style={styles.authorCopy}><Text style={styles.author}>{post.author.fullname}</Text><Text style={styles.meta}>{post.postType[0]}{post.postType.slice(1).toLowerCase()}  |  {relativeTime(post.createdAt)}</Text></View>
        <MaterialCommunityIcons name="dots-horizontal" size={25} color="#111820" />
      </View>
      {post.postType === 'VERSE' && post.verse ? (
        <View style={styles.verseCard}>
          <View style={styles.verseLabel}><MaterialCommunityIcons name="book-open-outline" size={22} color="#a86508" /><Text style={styles.verseReference}>{post.verse.reference}</Text></View>
          <Text style={styles.verseText}>“{post.verse.text}”</Text>
        </View>
      ) : null}
      {post.postType === 'PHOTO' && post.photoUrl ? <Image source={{ uri: post.photoUrl }} style={styles.photo} contentFit="cover" transition={180} /> : null}
      {post.content ? <Text style={[styles.content, post.postType === 'QUESTION' && styles.question]}>{post.content}</Text> : null}
      <View style={styles.divider} />
      <Pressable onPress={() => setOpen((current) => !current)} style={styles.commentButton}>
        <MaterialCommunityIcons name="comment-outline" size={22} color="#596475" />
        <Text style={styles.commentLabel}>{post.comments.length ? `${post.comments.length} comment${post.comments.length === 1 ? '' : 's'}` : 'Comment'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.comments}>
          {post.comments.map((item) => (
            <View key={item.commentId} style={styles.commentRow}>
              <Avatar name={item.author.fullname} uri={item.author.profilePictureUrl} size={31} />
              <View style={styles.commentBubble}><Text style={styles.commentAuthor}>{item.author.fullname} <Text style={styles.commentTime}>• {relativeTime(item.createdAt)}</Text></Text><Text style={styles.commentText}>{item.content}</Text></View>
            </View>
          ))}
          <View style={styles.commentComposer}>
            <TextInput value={comment} onChangeText={setComment} maxLength={600} placeholder="Write a comment…" placeholderTextColor="#9aa0aa" style={styles.commentInput} onSubmitEditing={submit} returnKeyType="send" />
            <Pressable disabled={!comment.trim() || commenting} onPress={submit} style={[styles.send, (!comment.trim() || commenting) && styles.disabled]}>
              {commenting ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="send" size={18} color="#fff" />}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderColor: '#e2e5e8', borderRadius: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center' }, authorCopy: { flex: 1, marginLeft: 13 },
  author: { color: '#151c24', fontSize: 15, fontWeight: '700' }, meta: { marginTop: 3, color: '#7b8492', fontSize: 12 },
  verseCard: { marginTop: 18, padding: 17, borderLeftWidth: 3, borderLeftColor: '#eb9718', borderRadius: 8, backgroundColor: '#fffaf3' },
  verseLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 }, verseReference: { color: '#9e620b', fontSize: 14, fontWeight: '600' },
  verseText: { marginTop: 15, color: '#19212a', fontFamily: 'serif', fontSize: 18, lineHeight: 29 },
  photo: { width: '100%', height: 245, marginTop: 17, borderRadius: 11, backgroundColor: '#f1f2f3' },
  content: { marginTop: 14, color: '#333d49', fontSize: 14, lineHeight: 22 }, question: { color: '#161d25', fontFamily: 'serif', fontSize: 19, lineHeight: 27, fontWeight: '700' },
  divider: { height: 1, marginTop: 18, backgroundColor: '#eceef0' },
  commentButton: { height: 43, flexDirection: 'row', alignItems: 'center', gap: 10 }, commentLabel: { color: '#596475', fontSize: 13, fontWeight: '500' },
  comments: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f1f2', gap: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' }, commentBubble: { flex: 1, marginLeft: 9, padding: 10, borderRadius: 11, backgroundColor: '#f7f7f7' },
  commentAuthor: { color: '#202831', fontSize: 11, fontWeight: '700' }, commentTime: { color: '#959ca6', fontWeight: '400' }, commentText: { marginTop: 3, color: '#4d5764', fontSize: 12, lineHeight: 18 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8 }, commentInput: { flex: 1, height: 42, paddingHorizontal: 13, borderWidth: 1, borderColor: '#e0e3e7', borderRadius: 12, color: '#1d252d', fontSize: 13, backgroundColor: '#fafafa' },
  send: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e69519' }, disabled: { opacity: 0.4 },
});
