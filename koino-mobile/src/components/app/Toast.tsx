import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastMessage = { id: number; text: string; tone?: 'success' | 'error' | 'info' };
type ShowToast = (message: ToastMessage, duration: number, onDismiss: () => void) => void;
const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<ToastMessage | null>(null); const [duration, setDuration] = useState(4000); const [dismiss, setDismiss] = useState<() => void>(() => () => {});
  const show = useCallback<ShowToast>((message, nextDuration, onDismiss) => { setActive(message); setDuration(nextDuration); setDismiss(() => onDismiss); }, []);
  useEffect(() => { if (!active) return; const timer = setTimeout(() => { setActive(null); dismiss(); }, duration); return () => clearTimeout(timer); }, [active, dismiss, duration]);
  const value = useMemo(() => show, [show]);
  return <ToastContext.Provider value={value}>{children}{active ? <View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toast, { top: Math.max(insets.top, 12) + 8 }, styles[active.tone ?? 'info']]}><Ionicons name={active.tone === 'success' ? 'checkmark-circle' : active.tone === 'error' ? 'alert-circle' : 'information-circle'} size={20} color="#fff" /><Text style={styles.text}>{active.text}</Text></View> : null}</ToastContext.Provider>;
}

export function Toast({ message, onDismiss, duration = 4000 }: { message: ToastMessage | null; onDismiss: () => void; duration?: number }) {
  const show = useContext(ToastContext);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => { if (message) show(message, duration, () => onDismissRef.current()); }, [duration, message, show]);
  return null;
}

const styles = StyleSheet.create({ toast: { position: 'absolute', zIndex: 1000, elevation: 20, left: 16, right: 16, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, success: { backgroundColor: '#237a4b' }, error: { backgroundColor: '#ad3d35' }, info: { backgroundColor: '#303944' }, text: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 18, fontWeight: '600' } });
