import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/app/Typography';

export type ReportReason = 'SEXUAL_CONTENT' | 'HARASSMENT' | 'HATE_SPEECH' | 'THREATS_OR_VIOLENCE' | 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'OTHER';

const options: { reason: ReportReason; pt: string; en: string }[] = [
  { reason: 'SEXUAL_CONTENT', pt: 'Conteúdo sexual ou nudez', en: 'Sexual content or nudity' },
  { reason: 'HARASSMENT', pt: 'Assédio ou bullying', en: 'Harassment or bullying' },
  { reason: 'HATE_SPEECH', pt: 'Discurso de ódio', en: 'Hate speech' },
  { reason: 'THREATS_OR_VIOLENCE', pt: 'Ameaças ou violência', en: 'Threats or violence' },
  { reason: 'SPAM', pt: 'Spam', en: 'Spam' },
  { reason: 'INAPPROPRIATE_CONTENT', pt: 'Conteúdo impróprio', en: 'Inappropriate content' },
  { reason: 'OTHER', pt: 'Outro', en: 'Other' },
];

export function ReportModal({ visible, portuguese, target, onClose, onSubmit }: { visible: boolean; portuguese: boolean; target: 'post' | 'user'; onClose: () => void; onSubmit: (reason: ReportReason, details: string) => Promise<boolean> }) {
  const [reason, setReason] = useState<ReportReason | null>(null); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() { if (!reason || busy) return; setBusy(true); try { if (await onSubmit(reason, details)) { setReason(null); setDetails(''); onClose(); } } finally { setBusy(false); } }
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.sheet}>
      <View style={styles.handle} /><View style={styles.header}><View style={styles.headerCopy}><Text style={styles.title}>{portuguese ? 'Porque está a denunciar?' : 'Why are you reporting this?'}</Text><Text style={styles.subtitle}>{portuguese ? (target === 'post' ? 'A publicação será enviada para análise.' : 'O perfil será enviado para análise.') : (target === 'post' ? 'The post will be sent for review.' : 'The profile will be sent for review.')}</Text></View><Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={21} color="#526071" /></Pressable></View>
      <ScrollView style={styles.options}>{options.map((item) => <Pressable key={item.reason} onPress={() => setReason(item.reason)} style={styles.option}><Ionicons name={reason === item.reason ? 'radio-button-on' : 'radio-button-off'} size={22} color={reason === item.reason ? '#df8607' : '#8a94a1'} /><Text style={styles.optionText}>{portuguese ? item.pt : item.en}</Text></Pressable>)}</ScrollView>
      {reason === 'OTHER' ? <TextInput value={details} onChangeText={setDetails} maxLength={600} multiline placeholder={portuguese ? 'Conte-nos o que aconteceu…' : 'Tell us what happened…'} placeholderTextColor="#8b94a0" style={styles.details} /> : null}
      <Pressable disabled={!reason || busy} onPress={submit} style={[styles.submit, (!reason || busy) && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{portuguese ? 'Enviar denúncia' : 'Submit report'}</Text>}</Pressable>
      <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{portuguese ? 'Cancelar' : 'Cancel'}</Text></Pressable>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,20,27,.42)' }, sheet: { maxHeight: '88%', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#fff' }, handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#d8dce1' }, header: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, headerCopy: { flex: 1 }, title: { color: '#151c24', fontSize: 20, fontWeight: '800' }, subtitle: { marginTop: 4, color: '#737d8a', fontSize: 12 }, close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f5f6' }, options: { marginTop: 14 }, option: { minHeight: 49, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e6e8eb', flexDirection: 'row', alignItems: 'center', gap: 12 }, optionText: { color: '#27313c', fontSize: 14 }, details: { minHeight: 78, marginTop: 12, padding: 12, borderWidth: 1, borderColor: '#dce1e6', borderRadius: 12, color: '#202a34', textAlignVertical: 'top' }, submit: { height: 49, marginTop: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#df8607' }, disabled: { opacity: .42 }, submitText: { color: '#fff', fontSize: 14, fontWeight: '700' }, cancel: { height: 43, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#596575', fontSize: 13, fontWeight: '600' } });
