import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: IconName | string;
  size?: number;
  color?: string;
  /** Use the user's accent color. */
  accent?: boolean;
}

export function Icon({ name, size = 20, color, accent }: Props) {
  const t = useTheme();
  return <Ionicons name={name as IconName} size={size} color={color ?? (accent ? t.accent : t.text)} />;
}
