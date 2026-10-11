import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Glow } from '@/components/ui/Glow';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/store/profile';
import { radius, springs, useTheme } from '@/theme';
import { OBJECTIVES, type ObjectiveId } from '@/types';

const STEPS = 3;

function Dot({ active }: { active: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(() => ({ width: withSpring(active ? 28 : 8, springs.snappy) }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: active ? t.accent : t.surfaceStrong }, style]} />;
}

export default function Onboarding() {
  const t = useTheme();
  const profile = useProfile();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<ObjectiveId[]>(profile.objectives);
  const [name, setName] = useState(profile.displayName);

  const toggle = (id: ObjectiveId) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const finish = (target: '/(auth)/register' | '/(auth)/login') => {
    profile.setProfile({ displayName: name.trim(), objectives: selected, onboarded: true });
    router.replace(target);
  };

  return (
    <Screen scroll={false} keyboard>
      <View style={styles.dots}>
        {Array.from({ length: STEPS }, (_, i) => (
          <Dot key={i} active={i === step} />
        ))}
      </View>

      {step === 0 ? (
        <Animated.View key="s0" entering={FadeInRight.duration(380)} exiting={FadeOutLeft.duration(200)} style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.halo}>
              <Glow size={340} intensity={0.5} />
            </View>
            <Logo size={132} />
          </View>
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ gap: 14 }}>
            <Text variant="display" style={{ fontSize: 44, lineHeight: 48 }}>
              Your life.{'\n'}
              <Text variant="display" color="accent" style={{ fontSize: 44, lineHeight: 48 }}>
                Organized.
              </Text>
            </Text>
            <Text variant="body" color="secondary" style={{ fontSize: 17, lineHeight: 25 }}>
              Tasks, habits, goals and focus in one calm operating system, built to level you up every single day.
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="s1" entering={FadeInRight.duration(380)} exiting={FadeOutLeft.duration(200)} style={styles.body}>
          <Text variant="title">What do you want to improve?</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 22 }}>
            Pick as many as you like. We'll tailor your starting point.
          </Text>
          <View style={styles.grid}>
            {OBJECTIVES.map((o, i) => {
              const on = selected.includes(o.id);
              return (
                <Animated.View key={o.id} entering={FadeInDown.delay(i * 60).duration(400)} layout={LinearTransition} style={styles.gridItem}>
                  <PressableScale
                    onPress={() => toggle(o.id)}
                    feedback="tap"
                    accessibilityState={{ selected: on }}
                    style={[styles.objective, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}
                  >
                    <View style={[styles.objIcon, { backgroundColor: on ? t.accent : t.surfaceStrong }]}>
                      <Icon name={o.icon} size={20} color={on ? t.onAccent : t.textSecondary} />
                    </View>
                    <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {o.label}
                    </Text>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {step === 2 ? (
        <Animated.View key="s2" entering={FadeInRight.duration(380)} exiting={FadeOutLeft.duration(200)} style={styles.body}>
          <Text variant="title">What should we call you?</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 22 }}>
            Your command center is almost ready.
          </Text>
          <Input value={name} onChangeText={setName} placeholder="Your first name" icon="person-outline" autoCapitalize="words" autoComplete="given-name" returnKeyType="done" />
          <View style={{ marginTop: 28, gap: 14 }}>
            {[
              ['checkmark-done', 'Plan your day with tasks'],
              ['flame', 'Build streaks that stick'],
              ['flag', 'Turn big goals into milestones'],
            ].map(([icon, label], i) => (
              <Animated.View key={label} entering={FadeInDown.delay(200 + i * 90)} style={styles.perk}>
                <View style={[styles.perkIcon, { backgroundColor: t.accentSoft }]}>
                  <Icon name={icon} size={18} color={t.accent} />
                </View>
                <Text variant="bodyMedium" color="secondary">
                  {label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.footer}>
        {step < STEPS - 1 ? (
          <>
            <Button title={step === 0 ? 'Get started' : 'Continue'} disabled={step === 1 && selected.length === 0} onPress={() => setStep(step + 1)} />
            {step === 0 ? <Button title="I already have an account" variant="ghost" onPress={() => finish('/(auth)/login')} /> : <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} />}
          </>
        ) : (
          <>
            <Button title="Create account" icon="arrow-forward" onPress={() => finish('/(auth)/register')} />
            <Button title="I already have an account" variant="ghost" onPress={() => finish('/(auth)/login')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginTop: 8, marginBottom: 12 },
  body: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, height: 180 },
  halo: { position: 'absolute', width: 340, height: 340 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.8%' },
  objective: { borderRadius: radius.lg, borderWidth: 1.5, padding: 16, gap: 14, minHeight: 112 },
  objIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: 6, paddingBottom: 12 },
});
