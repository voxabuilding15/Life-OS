import { Children, type ReactNode } from 'react';
import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useI18n } from '@/i18n';
import { typography, useTheme, type TextVariant } from '@/theme';
import { isolateLatinRuns, localizeTextStyle, RLM } from '@/theme/arabic';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent';
  align?: 'left' | 'center' | 'right';
  /**
   * User-written content (task titles, notes...). Its direction follows its own script rather than the
   * interface language, so English text inside the Arabic UI keeps correct punctuation and truncation.
   */
  content?: boolean;
}

export function Text({ variant = 'body', color = 'primary', align, content, style, children, ...rest }: Props) {
  const t = useTheme();
  const { rtl } = useI18n();
  const fill = {
    primary: t.text,
    secondary: t.textSecondary,
    tertiary: t.textTertiary,
    accent: t.accent,
    onAccent: t.onAccent,
  }[color];
  const flat = StyleSheet.flatten([typography[variant], { color: fill }, style]) as TextStyle;
  // 'left'/'right' in this API mean start/end of the reading direction; 'center' stays center.
  const textAlign = content ? 'auto' : align === 'center' ? 'center' : align ? (rtl ? (align === 'left' ? 'right' : 'left') : align) : rtl ? 'right' : 'left';
  const direction: TextStyle = content ? {} : { writingDirection: rtl ? 'rtl' : 'ltr' };
  // In Arabic, keep numbers, units and Latin names (XP, Pro, 3/5) in their own left-to-right order.
  const kids: ReactNode = rtl && !content ? Children.map(children, (c, i) => (typeof c === 'string' ? (i === 0 ? RLM : '') + isolateLatinRuns(c) : c)) : children;
  return (
    <RNText {...rest} style={[localizeTextStyle(flat, rtl), { textAlign }, direction]}>
      {kids}
    </RNText>
  );
}
