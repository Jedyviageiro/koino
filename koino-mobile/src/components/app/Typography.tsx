import { forwardRef } from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextInputProps, type TextProps } from 'react-native';
import { typography } from '@/theme/typography';

function familyFor(style: TextProps['style']) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily?.startsWith('Poppins_')) return flat.fontFamily;
  if (flat.fontStyle === 'italic') return typography.editorial;
  const weight = Number(flat.fontWeight ?? 400);
  if (weight >= 700) return typography.bold;
  if (weight >= 600) return typography.semibold;
  if (weight >= 500) return typography.medium;
  return typography.regular;
}

export function AppText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[style, { fontFamily: familyFor(style) }]} />;
}

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[style, { fontFamily: familyFor(style) }]} />;
});
