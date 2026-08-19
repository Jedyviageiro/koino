import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/app/Typography';

import { LoadingState } from '@/components/app/ScreenState';
import { Avatar } from '@/components/community/Avatar';
import { SettingsScreen, settingsStyles } from '@/components/settings/SettingsUI';
import { getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import { getSettings, updateSettings, uploadProfilePicture } from '@/features/settings/settingsService';
import type { UserSettings } from '@/features/settings/types';
import { useLanguage } from '@/features/localization/LanguageProvider';
import { Toast, type ToastMessage } from '@/components/app/Toast';

export default function EditProfileScreen() {
  const { language } = useLanguage(); const pt = language === 'pt';
  const [form, setForm] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  useEffect(() => { getSettings().then(setForm).catch((failure) => setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível carregar o perfil.' : 'Unable to load your profile.' })); }, [pt]);
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
      setToast({ id: Date.now(), tone: 'success', text: pt ? 'Foto atualizada.' : 'Profile photo updated.' });
    } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível atualizar a foto.' : 'Could not update your photo.' }); }
    finally { setSaving(false); }
  }
  async function save() {
    if (!form || saving) return;
    setSaving(true);
    try {
      const updated = await updateSettings({ fullname: form.fullname, email: form.email, username: form.username, timeZone: form.timeZone, language: form.language, bio: form.bio, location: form.location, countryCode: form.countryCode });
      setForm(updated);
      const session = await getAuthSession(); if (session) await saveAuthSession({ ...session, fullname: updated.fullname, email: updated.email, username: updated.username, profilePictureUrl: updated.profilePictureUrl, language: updated.language });
      setToast({ id: Date.now(), tone: 'success', text: pt ? 'Perfil guardado.' : 'Your profile has been saved.' });
    } catch (failure) { setToast({ id: Date.now(), tone: 'error', text: failure instanceof Error ? failure.message : pt ? 'Não foi possível guardar o perfil.' : 'Could not save your profile.' }); }
    finally { setSaving(false); }
  }
  return (
    <SettingsScreen title={pt ? 'Editar perfil' : 'Edit Profile'}>
      {!form ? <LoadingState label={pt ? 'A carregar perfil…' : 'Loading profile…'} /> : <>
        <View style={styles.avatarArea}><Avatar name={form.fullname} uri={form.profilePictureUrl} size={83} /><Pressable disabled={saving} onPress={choosePhoto} style={[styles.camera, saving && styles.disabled]}><MaterialCommunityIcons name="camera" size={17} color="#fff" /></Pressable><Text style={styles.change}>{pt ? 'Alterar foto' : 'Change photo'}</Text><Text style={styles.photoHelp}>JPG, PNG ou WebP · máx. 5 MB</Text></View>
        <Field label={pt ? 'Nome completo' : 'Full Name'} value={form.fullname} onChangeText={(value) => field('fullname', value)} />
        <Field label={pt ? 'Nome de utilizador' : 'Username'} value={form.username} onChangeText={(value) => field('username', value)} prefix="@" helper={pt ? 'Letras, números, pontos e sublinhados.' : 'Letters, numbers, dots, and underscores.'} />
        <Field label="Email" value={form.email} onChangeText={(value) => field('email', value)} keyboardType="email-address" />
        <Field label="Bio" value={form.bio ?? ''} onChangeText={(value) => field('bio', value)} multiline placeholder={pt ? 'Partilhe um pouco da sua caminhada de fé.' : 'Share a little about your faith journey.'} />
        <Field label={pt ? 'Código do país' : 'Country code'} value={form.countryCode ?? ''} onChangeText={(value) => field('countryCode', value.toUpperCase().slice(0, 2))} placeholder="MZ" helper={pt ? 'Use o código de país com duas letras.' : 'Use a two-letter country code.'} />
        <Field label={pt ? 'Localização' : 'Location'} value={form.location ?? ''} onChangeText={(value) => field('location', value)} placeholder="Maputo" />
        <Field label={pt ? 'Fuso horário' : 'Time zone'} value={form.timeZone} onChangeText={(value) => field('timeZone', value)} placeholder="Africa/Maputo" />
        <Pressable disabled={saving} onPress={save} style={[settingsStyles.primary, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={settingsStyles.primaryText}>{pt ? 'Guardar alterações' : 'Save Changes'}</Text>}</Pressable>
      </>}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </SettingsScreen>
  );
}

function Field({ label, helper, prefix, multiline, ...props }: { label: string; helper?: string; prefix?: string; multiline?: boolean } & TextInputProps) {
  return <View style={settingsStyles.fieldGroup}><Text style={settingsStyles.fieldLabel}>{label}</Text><View style={[styles.fieldWrap, multiline && styles.multiline]}>{prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}<TextInput {...props} multiline={multiline} style={[settingsStyles.field, styles.input, multiline && styles.textarea]} placeholderTextColor="#9aa1aa" /></View>{helper ? <Text style={settingsStyles.helper}>{helper}</Text> : null}</View>;
}
const styles = StyleSheet.create({
  avatarArea: { marginBottom: 12, alignItems: 'center' }, camera: { position: 'absolute', top: 59, right: '37%', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed9210', borderWidth: 3, borderColor: '#fff' }, change: { marginTop: 10, color: '#303944', fontSize: 13, fontWeight: '600' }, photoHelp: { marginTop: 4, color: '#838b96', fontSize: 11 },
  fieldWrap: { minHeight: 50, borderWidth: 1, borderColor: '#dfe3e8', borderRadius: 10, flexDirection: 'row', alignItems: 'center' }, multiline: { minHeight: 88, alignItems: 'flex-start' }, prefix: { paddingLeft: 13, paddingTop: 1, color: '#737d8a', fontSize: 13 }, input: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }, textarea: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' }, disabled: { opacity: 0.45 },
});
