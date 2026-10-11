import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { BASE } from '@/theme';
import { AmbientBackground } from '../ui/AmbientBackground';
import { Glow } from '../ui/Glow';
import { Logo, Wordmark } from '../ui/Logo';
import { Text } from '../ui/Text';

/** Launch animation: the mark materialises inside a pulsing blue glow, then the wordmark rises. */
export function SplashOverlay() {
  const logo = useSharedValue(0);
  const glow = useSharedValue(0);
  const word = useSharedValue(0);

  useEffect(() => {
    logo.value = withSpring(1, { damping: 12, stiffness: 90 });
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), withTiming(0.55, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1);
    word.value = withDelay(450, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [logo, glow, word]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: interpolate(logo.value, [0, 1], [0.6, 1]) }, { rotate: `${interpolate(logo.value, [0, 1], [-40, 0])}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.9, transform: [{ scale: interpolate(glow.value, [0, 1], [0.85, 1.15]) }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: interpolate(word.value, [0, 1], [14, 0]) }] }));

  return (
    <Animated.View exiting={FadeOut.duration(450)} style={[StyleSheet.absoluteFill, styles.root]} accessibilityLabel="Loading Life OS">
      <AmbientBackground />
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]}>
          <Glow size={420} intensity={0.55} />
        </Animated.View>
        <Animated.View style={logoStyle}>
          <Logo size={120} />
        </Animated.View>
        <Animated.View style={[{ alignItems: 'center', marginTop: 36, gap: 14 }, wordStyle]}>
          <Wordmark height={40} />
          <Text variant="caption" color="secondary" style={{ letterSpacing: 2 }}>
            YOUR LIFE. ORGANIZED.
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BASE.dark, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 420, height: 420, marginBottom: 96 },
  word: { fontSize: 38, fontFamily: 'Inter_800ExtraBold', color: BASE.white, letterSpacing: -1.2, marginBottom: 6 },
});
