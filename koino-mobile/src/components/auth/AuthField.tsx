import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type AuthFieldProps = TextInputProps & {
  icon: IconName;
  password?: boolean;
};

export function AuthField({ icon, password = false, style, ...props }: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={24} color="#17212d" />
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#969daa"
        secureTextEntry={password && !passwordVisible}
        selectionColor="#c58a28"
      />
      {password ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          hitSlop={12}
          onPress={() => setPasswordVisible((visible) => !visible)}
        >
          <MaterialCommunityIcons
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color="#8b929f"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#d9dde2',
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  input: { flex: 1, height: '100%', color: '#111a25', fontSize: 16 },
});
