import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { levelTitle } from '@/lib/gamification';
import { useFeedback, type FeedbackEvent } from '@/store/feedback';
import { alpha, BASE, radius, springs, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

function useAutoDismiss(id: number, ms: number) {
  const dismiss = useFeedback((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), ms);
    return () => clearTimeout(timer);
  }, [id, ms, dismiss]);
}

function XpPop({ event }: { event: Extract<FeedbackEvent, { type: 'xp' }> }) {
  const t = useTheme();
  useAutoDismiss(event.id, 1900);
  useEffect(() => {
    haptic.success();
  }, []);
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14)}
      exiting={FadeOutUp.duration(250)}
      style={[styles.pill, { backgroundColor: t.surfaceSolid, borderColor: t.accentBorder, shadowColor: t.accent }]}
    >
      <View style={[styles.xpBadge, { backgroundColor: t.accent }]}>
        <Icon name="flash" size={14} color={t.onAccent} />
      </View>
      <Text variant="bodyMedium" color="accent" style={{ fontFamily: 'Inter_700Bold' }}>
        +{event.amount} XP
      </Text>
      <Text variant="caption" color="secondary">
        {event.label}
      </Text>
    </Animated.View>
  );
}

function AchievementPop({ event }: { event: Extract<FeedbackEvent, { type: 'achievement' }> }) {
  const t = useTheme();
  useAutoDismiss(event.id, 4200);
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.duration(250)}
      style={[styles.achievement, { backgroundColor: t.surfaceSolid, borderColor: t.accentBorder, shadowColor: t.accent }]}
    >
      <View style={[styles.achIcon, { backgroundColor: t.accentSoft }]}>
        <Icon name={event.achievement.icon} size={22} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="micro" color="accent">
          ACHIEVEMENT UNLOCKED
        </Text>
        <Text variant="bodyMedium">{event.achievement.title}</Text>
        <Text variant="caption" color="secondary">
          {event.achievement.description}
        </Text>
      </View>
    </Animated.View>
  );
}

function Toast({ event }: { event: Extract<FeedbackEvent, { type: 'toast' }> }) {
  const t = useTheme();
  useAutoDismiss(event.id, 2600);
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={[styles.pill, { backgroundColor: t.surfaceSolid, borderColor: t.borderStrong }]}>
      <Text variant="caption">{event.message}</Text>
    </Animated.View>
  );
}

const PARTICLES = 16;

function Particle({ index, progress }: { index: number; progress: { value: number } }) {
  const t = useTheme();
  const angle = (index / PARTICLES) * Math.PI * 2;
  const dist = 110 + (index % 3) * 40;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * dist * progress.value },
      { translateY: Math.sin(angle) * dist * progress.value },
      { scale: interpolate(progress.value, [0, 1], [1, 0.3]) },
    ],
  }));
  return <Animated.View style={[styles.particle, { backgroundColor: index % 2 ? t.accent : BASE.white }, style]} />;
}

function LevelUp({ event }: { event: Extract<FeedbackEvent, { type: 'levelUp' }> }) {
  const t = useTheme();
  const dismiss = useFeedback((s) => s.dismiss);
  const burst = useSharedValue(0);
  const oldNum = useSharedValue(1);
  const newNum = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    haptic.success();
    ring.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    oldNum.value = withDelay(500, withTiming(0, { duration: 350 }));
    newNum.value = withDelay(800, withSpring(1, { damping: 9, stiffness: 160 }));
    burst.value = withDelay(800, withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    const timer = setTimeout(() => dismiss(event.id), 4200);
    return () => clearTimeout(timer);
  }, [event.id, dismiss, burst, newNum, oldNum, ring]);

  const oldStyle = useAnimatedStyle(() => ({
    opacity: oldNum.value,
    transform: [{ translateY: interpolate(oldNum.value, [1, 0], [0, -40]) }, { scale: interpolate(oldNum.value, [1, 0], [1, 0.6]) }],
  }));
  const newStyle = useAnimatedStyle(() => ({
    opacity: newNum.value,
    transform: [{ scale: interpolate(newNum.value, [0, 1], [0.3, 1]) }, { translateY: interpolate(newNum.value, [0, 1], [30, 0]) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(ring.value, [0, 1], [0.6, 1]) }], opacity: ring.value }));

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, styles.levelWrap, { backgroundColor: alpha(BASE.dark, 0.92) }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss(event.id)} accessibilityLabel="Dismiss level up" />
      <View pointerEvents="none" style={styles.levelCenter}>
        {Array.from({ length: PARTICLES }, (_, i) => (
          <Particle key={i} index={i} progress={burst} />
        ))}
        <Animated.View style={[styles.levelRing, { borderColor: t.accent, shadowColor: t.accent }, ringStyle]}>
          <Animated.Text style={[styles.levelNum, { color: t.text, position: 'absolute' }, oldStyle]}>{event.from}</Animated.Text>
          <Animated.Text style={[styles.levelNum, { color: t.accent }, newStyle]}>{event.to}</Animated.Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(900).duration(500)} style={{ alignItems: 'center', gap: 6, marginTop: 36 }}>
          <Text variant="micro" color="accent">
            LEVEL UP
          </Text>
          <Text variant="title" align="center">
            You reached level {event.to}
          </Text>
          <Text variant="body" color="secondary">
            {levelTitle(event.to)}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** Renders XP pops, achievements, toasts and the level-up celebration above the whole app. */
export function FeedbackLayer() {
  const queue = useFeedback((s) => s.queue);
  const insets = useSafeAreaInsets();
  const level = queue.find((e) => e.type === 'levelUp');
  const top = queue.filter((e) => e.type === 'xp' || e.type === 'achievement').slice(0, 3);
  const toasts = queue.filter((e) => e.type === 'toast').slice(-1);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="none" style={[styles.stack, { top: insets.top + 10 }]}>
        {top.map((e) => (e.type === 'xp' ? <XpPop key={e.id} event={e} /> : e.type === 'achievement' ? <AchievementPop key={e.id} event={e} /> : null))}
      </View>
      <View pointerEvents="none" style={[styles.toasts, { bottom: insets.bottom + 100 }]}>
        {toasts.map((e) => e.type === 'toast' && <Toast key={e.id} event={e} />)}
      </View>
      {level && level.type === 'levelUp' ? <LevelUp key={level.id} event={level} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8 },
  toasts: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 8, paddingRight: 16, borderRadius: radius.pill, borderWidth: 1, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  xpBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, width: '100%', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  achIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelWrap: { alignItems: 'center', justifyContent: 'center' },
  levelCenter: { alignItems: 'center', justifyContent: 'center' },
  levelRing: { width: 168, height: 168, borderRadius: 84, borderWidth: 4, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.7, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  levelNum: { fontSize: 76, fontFamily: 'Inter_800ExtraBold', letterSpacing: -3 },
  particle: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
});
