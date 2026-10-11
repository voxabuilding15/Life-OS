import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Icons that point in a direction of travel and must mirror in right-to-left languages. */
const DIRECTIONAL = new Set<string>([
  'chevron-back',
  'chevron-forward',
  'arrow-back',
  'arrow-forward',
  'arrow-undo',
  'play-skip-forward',
  'play-skip-back',
  'log-out',
  'trending-up',
  'trending-down',
]);

interface Props {
  name: IconName | string;
  size?: number;
  color?: string;
  /** Use the user's accent color. */
  accent?: boolean;
}

export function Icon({ name, size = 20, color, accent }: Props) {
  const t = useTheme();
  const { rtl } = useI18n();
  const flip = rtl && DIRECTIONAL.has(name);
  return <Ionicons name={name as IconName} size={size} color={color ?? (accent ? t.accent : t.text)} style={flip ? { transform: [{ scaleX: -1 }] } : undefined} />;
}
