import { Text as RNText, type TextProps } from 'react-native';
import { typography, useTheme, type TextVariant } from '@/theme';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent';
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'primary', align, style, ...rest }: Props) {
  const t = useTheme();
  const fill = {
    primary: t.text,
    secondary: t.textSecondary,
    tertiary: t.textTertiary,
    accent: t.accent,
    onAccent: t.onAccent,
  }[color];
  return <RNText {...rest} style={[typography[variant], { color: fill, textAlign: align }, style]} />;
}
