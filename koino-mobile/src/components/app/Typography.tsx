import { forwardRef } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, type TextInputProps, type TextProps } from 'react-native';

export function AppText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={style} />;
}

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={style} />;
});
