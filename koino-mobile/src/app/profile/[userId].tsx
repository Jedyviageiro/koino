import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/app/AppShell';
import { ErrorState, LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { getUserProfile, requestFriend } from '@/features/settings/settingsService';
import type { PublicProfile } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { layout } from '@/theme/layout';

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ userId: string }>(); const userId = Number(params.userId);
  const { language } = useLanguage(); const pt = language === 'pt';
  const [profile, setProfile] = useState<PublicProfile | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (Number.isFinite(userId)) getUserProfile(userId).then(setProfile).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to load profile.')); }, [userId]);
  async function addFriend() { if (!profile) return; setBusy(true); try { await requestFriend(profile.userId); setProfile({ ...profile, friendshipStatus: 'PENDING_OUTGOING' }); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to send request.'); } finally { setBusy(false); } }
  return <AppShell active="community"><ScrollView contentContainerStyle={styles.screen}>
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color="#536071" /></Pressable>
    {!profile && !error ? <LoadingState label={pt ? 'A carregar perfil…' : 'Loading profile…'} /> : null}{error ? <ErrorState message={error} onRetry={() => getUserProfile(userId).then(setProfile)} /> : null}
    {profile ? <><View style={styles.hero}><Avatar name={profile.fullname} uri={profile.profilePictureUrl} size={82} /><Text style={styles.name}>{profile.fullname}</Text><Text style={styles.username}>@{profile.username}</Text>{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}{profile.location ? <Text style={styles.location}><Ionicons name="location-outline" size={14} /> {profile.location}</Text> : null}</View>
      <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNumber}>{profile.postsCount}</Text><Text style={styles.statLabel}>{pt ? 'Publicações' : 'Posts'}</Text></View><View style={styles.separator} /><View style={styles.stat}><Text style={styles.statNumber}>{profile.friendsCount}</Text><Text style={styles.statLabel}>{pt ? 'Amigos' : 'Friends'}</Text></View></View>
      {profile.friendshipStatus !== 'SELF' ? <Pressable disabled={busy || Boolean(profile.friendshipStatus)} onPress={addFriend} style={[styles.button, Boolean(profile.friendshipStatus) && styles.secondary]}><Ionicons name={profile.friendshipStatus === 'FRIENDS' ? 'checkmark-circle-outline' : 'person-add-outline'} size={19} color={!profile.friendshipStatus ? '#fff' : '#c77600'} /><Text style={[styles.buttonText, Boolean(profile.friendshipStatus) && styles.secondaryText]}>{profile.friendshipStatus === 'FRIENDS' ? (pt ? 'Amigos' : 'Friends') : profile.friendshipStatus === 'PENDING_OUTGOING' ? (pt ? 'Pedido enviado' : 'Request sent') : (pt ? 'Adicionar amigo' : 'Add friend')}</Text></Pressable> : null}
    </> : null}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ screen: { padding: layout.screenPadding, paddingBottom: 30 }, back: { width: 40, height: 40, justifyContent: 'center' }, hero: { alignItems: 'center', paddingTop: 12 }, name: { marginTop: 13, color: '#151c24', fontSize: 23, fontWeight: '800' }, username: { marginTop: 3, color: '#7b8491', fontSize: 13 }, bio: { marginTop: 13, maxWidth: 300, color: '#4f5966', fontSize: 13, lineHeight: 20, textAlign: 'center' }, location: { marginTop: 9, color: '#7b8491', fontSize: 12 }, stats: { marginTop: 24, paddingVertical: 15, borderWidth: 1, borderColor: '#e4e7ea', borderRadius: 14, flexDirection: 'row', backgroundColor: '#fff' }, stat: { flex: 1, alignItems: 'center' }, statNumber: { color: '#17202a', fontSize: 20, fontWeight: '800' }, statLabel: { marginTop: 3, color: '#7a8490', fontSize: 11 }, separator: { width: 1, backgroundColor: '#e4e7ea' }, button: { height: 46, marginTop: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e9900c' }, secondary: { borderWidth: 1, borderColor: '#efd7b4', backgroundColor: '#fff8ed' }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' }, secondaryText: { color: '#c77600' } });
