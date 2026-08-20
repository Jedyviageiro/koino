import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app/Typography';
import { useLanguage } from '@/features/localization/LanguageProvider';

type Props = { children: ReactNode; portuguese: boolean };
type State = { needsReset: boolean };

class Boundary extends Component<Props, State> {
  state: State = { needsReset: false };

  static getDerivedStateFromError(): State {
    return { needsReset: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Details stay inside the native runtime and are never rendered to users.
  }

  private recover = () => {
    this.setState({ needsReset: false });
    router.replace('/');
  };

  render() {
    if (!this.state.needsReset) return this.props.children;

    return (
      <View style={styles.screen}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="refresh-circle" size={38} color="#c78017" />
        </View>
        <Text style={styles.title}>{this.props.portuguese ? 'A Koino precisa de um momento' : 'Koino needs a moment'}</Text>
        <Text style={styles.message}>{this.props.portuguese ? 'Volte ao início e continue a sua jornada em segurança.' : 'Return to the start and continue your journey securely.'}</Text>
        <Pressable onPress={this.recover} style={styles.button}>
          <Text style={styles.buttonText}>{this.props.portuguese ? 'Voltar ao início' : 'Return to start'}</Text>
        </Pressable>
      </View>
    );
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <Boundary portuguese={language === 'pt'}>{children}</Boundary>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5e7' },
  title: { marginTop: 18, color: '#17202a', fontSize: 21, fontWeight: '700', textAlign: 'center' },
  message: { maxWidth: 300, marginTop: 9, color: '#6f7885', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  button: { height: 46, marginTop: 20, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e99a24' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
