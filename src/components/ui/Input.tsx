import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { font, radius, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  icon?: IconName;
  secure?: boolean;
  multiline?: boolean;
}

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, icon, secure, multiline, style, onFocus, onBlur, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="micro" color="tertiary" style={styles.label}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: t.surface, borderColor: error ? t.text : focused ? t.accent : t.border, minHeight: multiline ? 110 : 54 },
          multiline && { alignItems: 'flex-start', paddingTop: 14 },
        ]}
      >
        {icon ? <Icon name={icon} size={18} color={focused ? t.accent : t.textTertiary} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={hidden}
          multiline={multiline}
          placeholderTextColor={t.textTertiary}
          selectionColor={t.accent}
          cursorColor={t.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label ?? rest.placeholder}
          style={[styles.input, { color: t.text, fontFamily: font.regular }, multiline && { textAlignVertical: 'top', minHeight: 80 }, style]}
        />
        {secure ? (
          <PressableScale onPress={() => setHidden((h) => !h)} feedback="none" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} hitSlop={10}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={t.textTertiary} />
          </PressableScale>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="secondary" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { marginLeft: 4 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, outlineStyle: 'none' } as never,
  error: { marginLeft: 4 },
});
