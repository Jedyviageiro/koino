import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type AuthButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function AuthButton({ label, loading = false, disabled = false, onPress }: AuthButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, inactive && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color="#111820" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efc77f',
    shadowColor: '#d69b3e',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.82 },
  label: { color: '#101820', fontSize: 17, fontWeight: '700' },
});
