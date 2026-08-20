import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText as Text } from '@/components/app/Typography';

export function ImageViewerModal({ visible, uri, portuguese, onClose, onSaved, onError }: {
  visible: boolean;
  uri: string | null;
  portuguese: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!uri || saving) return;
    setSaving(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) throw new Error(portuguese ? 'Permita o acesso às fotos para guardar a imagem.' : 'Allow photo access to save this image.');
      const extension = uri.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/)?.[1]?.toLowerCase() ?? 'jpg';
      const destination = `${FileSystem.cacheDirectory}koino-${Date.now()}.${extension}`;
      const result = await FileSystem.downloadAsync(uri, destination);
      await MediaLibrary.saveToLibraryAsync(result.uri);
      onSaved();
    } catch (failure) {
      onError(failure instanceof Error ? failure.message : portuguese ? 'Não foi possível guardar a imagem.' : 'Unable to save this image.');
    } finally {
      setSaving(false);
    }
  }

  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.screen}>
      <View style={[styles.toolbar, { top: Math.max(insets.top, 12) + 8 }]}>
        <Pressable accessibilityLabel={portuguese ? 'Fechar imagem' : 'Close image'} onPress={onClose} style={styles.button}>
          <Ionicons name="close" size={25} color="#fff" />
        </Pressable>
        <Text style={styles.title}>{portuguese ? 'Imagem' : 'Image'}</Text>
        <Pressable accessibilityLabel={portuguese ? 'Guardar imagem' : 'Save image'} disabled={saving} onPress={save} style={styles.button}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="download-outline" size={23} color="#fff" />}
        </Pressable>
      </View>
      {uri ? <Image source={{ uri }} style={styles.image} contentFit="contain" transition={180} /> : null}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,12,17,.97)' },
  toolbar: { position: 'absolute', zIndex: 2, left: 14, right: 14, height: 50, flexDirection: 'row', alignItems: 'center' },
  button: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)' },
  title: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  image: { width: '100%', height: '82%' },
});
