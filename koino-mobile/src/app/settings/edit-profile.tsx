import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { SettingsScreen, settingsStyles } from '@/components/settings/SettingsUI';
import { getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import { getSettings, updateSettings, uploadProfilePicture } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';

export default function EditProfileScreen() {
  const [form, setForm] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => { getSettings().then(setForm).catch((failure) => setStatus(failure instanceof Error ? failure.message : 'Unable to load your profile.')); }, []);
  function field(key: keyof UserSettings, value: string) { setForm((current) => current ? { ...current, [key]: value } : current); }
  async function choosePhoto() {
    if (!form) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setSaving(true);
    try {
      const updated = await uploadProfilePicture(asset.uri, asset.mimeType ?? null, asset.fileName ?? null);
      setForm({ ...form, profilePictureUrl: updated.profilePictureUrl });
      const session = await getAuthSession(); if (session) await saveAuthSession({ ...session, profilePictureUrl: updated.profilePictureUrl });
      setStatus('Profile photo updated.');
    } catch (failure) { setStatus(failure instanceof Error ? failure.message : 'Could not update your photo.'); }
    finally { setSaving(false); }
  }
  async function save() {
    if (!form || saving) return;
    setSaving(true); setStatus('');
    try {
      const updated = await updateSettings({ fullname: form.fullname, email: form.email, username: form.username, timeZone: form.timeZone, language: form.language, bio: form.bio, location: form.location, countryCode: form.countryCode });
      setForm(updated);
      const session = await getAuthSession(); if (session) await saveAuthSession({ ...session, fullname: updated.fullname, email: updated.email, username: updated.username, profilePictureUrl: updated.profilePictureUrl, language: updated.language });
      setStatus('Your profile has been saved.');
    } catch (failure) { setStatus(failure instanceof Error ? failure.message : 'Could not save your profile.'); }
    finally { setSaving(false); }
  }
  return (
    <SettingsScreen title="Edit Profile">
      {!form ? <LoadingState label="Loading profile..." /> : <>
        <View style={styles.avatarArea}><Avatar name={form.fullname} uri={form.profilePictureUrl} size={83} /><Pressable onPress={choosePhoto} style={styles.camera}><MaterialCommunityIcons name="camera" size={17} color="#fff" /></Pressable><Text style={styles.change}>Change photo</Text><Text style={styles.photoHelp}>JPG, PNG, or WebP. Maximum 5 MB.</Text></View>
        <Field label="Full Name" value={form.fullname} onChangeText={(value) => field('fullname', value)} />
        <Field label="Username" value={form.username} onChangeText={(value) => field('username', value)} prefix="@" helper="Letters, numbers, dots, and underscores." />
        <Field label="Email" value={form.email} onChangeText={(value) => field('email', value)} keyboardType="email-address" />
        <Field label="Bio" value={form.bio ?? ''} onChangeText={(value) => field('bio', value)} multiline placeholder="Share a little about your faith journey." />
        <Field label="Country code" value={form.countryCode ?? ''} onChangeText={(value) => field('countryCode', value.toUpperCase().slice(0, 2))} placeholder="MZ" helper="Use a two-letter country code." />
        <Field label="Location" value={form.location ?? ''} onChangeText={(value) => field('location', value)} placeholder="Maputo" />
        <Field label="Time zone" value={form.timeZone} onChangeText={(value) => field('timeZone', value)} placeholder="Africa/Maputo" />
        <Pressable disabled={saving} onPress={save} style={settingsStyles.primary}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={settingsStyles.primaryText}>Save Changes</Text>}</Pressable>
      </>}
      {status ? <Pressable onPress={() => setStatus('')}><Text style={settingsStyles.status}>{status}</Text></Pressable> : null}
    </SettingsScreen>
  );
}

function Field({ label, helper, prefix, multiline, ...props }: { label: string; helper?: string; prefix?: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={settingsStyles.fieldGroup}><Text style={settingsStyles.fieldLabel}>{label}</Text><View style={[styles.fieldWrap, multiline && styles.multiline]}>{prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}<TextInput {...props} multiline={multiline} style={[settingsStyles.field, styles.input, multiline && styles.textarea]} placeholderTextColor="#9aa1aa" /></View>{helper ? <Text style={settingsStyles.helper}>{helper}</Text> : null}</View>;
}
const styles = StyleSheet.create({
  avatarArea: { marginBottom: 12, alignItems: 'center' }, camera: { position: 'absolute', top: 59, right: '37%', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed9210', borderWidth: 3, borderColor: '#fff' }, change: { marginTop: 10, color: '#303944', fontSize: 11, fontWeight: '600' }, photoHelp: { marginTop: 4, color: '#838b96', fontSize: 9 },
  fieldWrap: { minHeight: 46, borderWidth: 1, borderColor: '#dfe3e8', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }, multiline: { minHeight: 88, alignItems: 'flex-start' }, prefix: { paddingLeft: 13, paddingTop: 1, color: '#737d8a', fontSize: 13 }, input: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }, textarea: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
});
