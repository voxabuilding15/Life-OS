import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { alpha, useTheme } from '@/theme';
import { Button } from './Button';
import { Floating, Pulse } from './Floating';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface Props {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Small "did you know" line under the actions. */
  hint?: string;
  /** Icons orbiting the main one. */
  satellites?: [IconName, IconName, IconName];
}

/** Layered illustration (pulsing rings, floating icon, satellites) + copy + actions. */
export function EmptyState({ icon, title, message, actionLabel, onAction, secondaryLabel, onSecondary, hint, satellites }: Props) {
  const t = useTheme();
  const sat = satellites ?? ['sparkles', 'star', 'ellipse'];
  return (
    <Animated.View entering={FadeInUp.duration(550)} style={styles.wrap}>
      <View style={styles.art}>
        <Pulse scale={1.12} duration={2400} style={[styles.ring, { width: 168, height: 168, borderRadius: 84, borderColor: alpha(t.accent, 0.12), backgroundColor: alpha(t.accent, 0.04) }]} />
        <Pulse scale={1.08} duration={1900} style={[styles.ring, { width: 124, height: 124, borderRadius: 62, borderColor: t.accentBorder, backgroundColor: t.accentSoft }]} />
        <Floating style={[styles.core, { backgroundColor: t.surfaceSolid, borderColor: t.accentBorder, shadowColor: t.accent }]}>
          <Icon name={icon} size={34} color={t.accent} />
        </Floating>
        <Floating distance={5} duration={1800} delay={200} style={[styles.sat, { top: 14, right: 18, backgroundColor: t.surfaceSolid, borderColor: t.border }]}>
          <Icon name={sat[0]} size={14} color={t.accent} />
        </Floating>
        <Floating distance={4} duration={2100} delay={500} style={[styles.sat, { bottom: 20, left: 12, backgroundColor: t.surfaceSolid, borderColor: t.border }]}>
          <Icon name={sat[1]} size={14} color={t.textSecondary} />
        </Floating>
        <Floating distance={6} duration={2500} delay={900} style={[styles.sat, { bottom: 6, right: 34, width: 22, height: 22, borderRadius: 11, backgroundColor: t.surfaceSolid, borderColor: t.border }]}>
          <Icon name={sat[2]} size={10} color={t.accent} />
        </Floating>
      </View>
      <Text variant="title" align="center" style={{ fontSize: 22, lineHeight: 28 }}>
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center" style={styles.msg}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} fullWidth={false} size="md" icon="add" style={{ marginTop: 8 }} /> : null}
      {secondaryLabel && onSecondary ? <Button title={secondaryLabel} onPress={onSecondary} fullWidth={false} size="sm" variant="ghost" /> : null}
      {hint ? (
        <View style={[styles.hint, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Icon name="bulb-outline" size={14} color={t.accent} />
          <Text variant="caption" color="secondary" style={{ flexShrink: 1 }}>
            {hint}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 10 },
  art: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  ring: { position: 'absolute', borderWidth: 1 },
  core: { width: 80, height: 80, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 6 } },
  sat: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  msg: { maxWidth: 290 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, maxWidth: 300 },
});
