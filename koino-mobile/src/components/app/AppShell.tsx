import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from './AppBottomNav';

type Tab = 'home' | 'plans' | 'bible' | 'community' | 'chat' | 'settings';

export function AppShell({ active, children }: PropsWithChildren<{ active: Tab }>) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.body}>{children}</View>
      <AppBottomNav active={active} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#fff' }, body: { flex: 1 } });
