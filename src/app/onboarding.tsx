import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, FadeOutLeft, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Floating } from '@/components/ui/Floating';
import { Glow } from '@/components/ui/Glow';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { formatHm } from '@/components/ui/TimePicker';
import { STARTER_HABITS } from '@/lib/habitIcons';
import { haptic } from '@/lib/haptics';
import { createHabit } from '@/services/actions';
import { ensureNotificationPermission, syncDailyReminder } from '@/services/notifications';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { radius, springs, useTheme } from '@/theme';
import { OBJECTIVES, type ObjectiveId } from '@/types';
import { config } from '@/lib/config';

const STEPS = 5;
const REMINDER_TIMES = [
  { time: '08:00', label: 'Morning', icon: 'sunny' },
  { time: '13:00', label: 'Midday', icon: 'partly-sunny' },
  { time: '20:30', label: 'Evening', icon: 'moon' },
] as const;

function Dot({ active, done }: { active: boolean; done: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(() => ({ width: withSpring(active ? 28 : 8, springs.snappy) }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: active || done ? t.accent : t.surfaceStrong, opacity: active ? 1 : done ? 0.6 : 1 }, style]} />;
}

function FloatingChip({ icon, label, style, delay }: { icon: string; label: string; style: object; delay: number }) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(400 + delay).springify().damping(14)} style={[{ position: 'absolute' }, style]}>
      <Floating delay={delay} distance={5} duration={2200 + delay}>
        <View style={[styles.floatChip, { backgroundColor: t.surfaceSolid, borderColor: t.accentBorder, shadowColor: t.accent }]}>
          <Icon name={icon} size={14} color={t.accent} />
          <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {label}
          </Text>
        </View>
      </Floating>
    </Animated.View>
  );
}

export default function Onboarding() {
  const t = useTheme();
  const profile = useProfile();
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<ObjectiveId[]>(profile.objectives);
  const [habits, setHabits] = useState<string[]>([]);
  const [time, setTime] = useState<(typeof REMINDER_TIMES)[number]['time'] | null>('20:30');
  const [name, setName] = useState(profile.displayName);
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    return selected
      .flatMap((o) => STARTER_HABITS[o] ?? [])
      .filter((h) => !seen.has(h.name) && seen.add(h.name))
      .slice(0, 8);
  }, [selected]);

  const toggleObjective = (id: ObjectiveId) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleHabit = (n: string) =>
    setHabits((h) => {
      if (h.includes(n)) return h.filter((x) => x !== n);
      if (h.length >= config.freeHabitLimit) {
        haptic.warning();
        return h;
      }
      return [...h, n];
    });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const askReminders = async () => {
    setBusy(true);
    const granted = time ? await ensureNotificationPermission() : false;
    settings.set({ notifications: granted, dailyReminder: granted && Boolean(time) });
    setBusy(false);
    next();
  };

  const finish = async (target: '/(auth)/register' | '/(auth)/login') => {
    setBusy(true);
    for (const n of habits) {
      const h = suggestions.find((s) => s.name === n);
      if (h) createHabit({ name: h.name, icon: h.icon, reminderTime: null });
    }
    profile.setProfile({ displayName: name.trim(), objectives: selected, onboarded: true });
    void syncDailyReminder();
    setBusy(false);
    router.replace(target);
  };

  const enter = FadeInRight.duration(380);
  const exit = FadeOutLeft.duration(180);

  return (
    <Screen scroll={false} keyboard>
      <View style={styles.top}>
        <View style={{ width: 60 }}>{step > 0 ? <Text variant="caption" color="secondary" onPress={back} accessibilityRole="button">Back</Text> : null}</View>
        <View style={styles.dots}>
          {Array.from({ length: STEPS }, (_, i) => (
            <Dot key={i} active={i === step} done={i < step} />
          ))}
        </View>
        <View style={{ width: 60, alignItems: 'flex-end' }}>
          {step === 2 || step === 3 ? (
            <Text variant="caption" color="secondary" onPress={step === 2 ? next : () => (setTime(null), next())} accessibilityRole="button">
              Skip
            </Text>
          ) : null}
        </View>
      </View>

      {step === 0 ? (
        <Animated.View key="s0" entering={enter} exiting={exit} style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.halo} pointerEvents="none">
              <Glow size={380} intensity={0.55} />
            </View>
            <Floating distance={4} duration={2600}>
              <Logo size={132} />
            </Floating>
            <FloatingChip icon="flame" label="15 day streak" style={{ left: 0, top: 18 }} delay={0} />
            <FloatingChip icon="checkmark-circle" label="3/5 done" style={{ right: 0, top: 54 }} delay={300} />
            <FloatingChip icon="speedometer" label="Life Score 82" style={{ left: 18, bottom: 6 }} delay={600} />
            <FloatingChip icon="flash" label="+20 XP" style={{ right: 14, bottom: 26 }} delay={900} />
          </View>
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ gap: 14 }}>
            <Text variant="display" style={{ fontSize: 44, lineHeight: 48 }}>
              Your life.{'\n'}
              <Text variant="display" color="accent" style={{ fontSize: 44, lineHeight: 48 }}>
                Organized.
              </Text>
            </Text>
            <Text variant="body" color="secondary" style={{ fontSize: 17, lineHeight: 25 }}>
              Tasks, habits, goals and focus in one calm operating system. Built to level you up every single day.
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="s1" entering={enter} exiting={exit} style={styles.body}>
          <Text variant="title">What do you want to improve?</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 22 }}>
            Pick as many as you like. We'll tailor your starting point.
          </Text>
          <View style={styles.grid}>
            {OBJECTIVES.map((o, i) => {
              const on = selected.includes(o.id);
              return (
                <Animated.View key={o.id} entering={FadeInDown.delay(i * 60).duration(400)} layout={LinearTransition} style={styles.gridItem}>
                  <PressableScale onPress={() => toggleObjective(o.id)} feedback="tap" accessibilityState={{ selected: on }} style={[styles.objective, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}>
                    <View style={[styles.objIcon, { backgroundColor: on ? t.accent : t.surfaceStrong }]}>
                      <Icon name={o.icon} size={20} color={on ? t.onAccent : t.textSecondary} />
                    </View>
                    <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {o.label}
                    </Text>
                    {on ? (
                      <Animated.View entering={FadeInDown.springify()} style={styles.tick}>
                        <Icon name="checkmark-circle" size={20} color={t.accent} />
                      </Animated.View>
                    ) : null}
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {step === 2 ? (
        <Animated.View key="s2" entering={enter} exiting={exit} style={styles.body}>
          <Text variant="title">Start with a few habits</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 18 }}>
            Pick up to {config.freeHabitLimit}. Small and daily beats big and rare.
          </Text>
          <View style={{ gap: 10 }}>
            {suggestions.map((h, i) => {
              const on = habits.includes(h.name);
              return (
                <Animated.View key={h.name} entering={FadeInLeft.delay(i * 50).duration(350)} layout={LinearTransition}>
                  <PressableScale onPress={() => toggleHabit(h.name)} feedback="tap" accessibilityState={{ selected: on }} style={[styles.habit, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}>
                    <View style={[styles.objIcon, { width: 38, height: 38, backgroundColor: on ? t.accent : t.surfaceStrong }]}>
                      <Icon name={h.icon} size={18} color={on ? t.onAccent : t.textSecondary} />
                    </View>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      {h.name}
                    </Text>
                    <Icon name={on ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={on ? t.accent : t.textTertiary} />
                  </PressableScale>
                </Animated.View>
              );
            })}
            {suggestions.length === 0 ? (
              <Text variant="body" color="tertiary">
                You can add habits any time from the Habits tab.
              </Text>
            ) : null}
          </View>
          <Text variant="caption" color="tertiary" style={{ marginTop: 14 }}>
            {habits.length}/{config.freeHabitLimit} selected
          </Text>
        </Animated.View>
      ) : null}

      {step === 3 ? (
        <Animated.View key="s3" entering={enter} exiting={exit} style={styles.body}>
          <Floating distance={4}>
            <View style={[styles.bell, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
              <Icon name="notifications" size={30} color={t.accent} />
            </View>
          </Floating>
          <Text variant="title" style={{ marginTop: 20 }}>
            When should we nudge you?
          </Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 20 }}>
            A gentle daily check-in helps your streaks survive. Change it any time in Settings.
          </Text>
          <View style={{ gap: 10 }}>
            {REMINDER_TIMES.map((r) => {
              const on = time === r.time;
              return (
                <PressableScale key={r.time} onPress={() => setTime(r.time)} feedback="tap" accessibilityState={{ selected: on }} style={[styles.habit, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}>
                  <Icon name={r.icon} size={22} color={on ? t.accent : t.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{r.label}</Text>
                    <Text variant="caption" color="secondary">
                      Around {formatHm(r.time)}
                    </Text>
                  </View>
                  <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? t.accent : t.textTertiary} />
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {step === 4 ? (
        <Animated.View key="s4" entering={enter} exiting={exit} style={styles.body}>
          <Text variant="title">What should we call you?</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 20 }}>
            Your command center is ready.
          </Text>
          <Input value={name} onChangeText={setName} placeholder="Your first name" icon="person-outline" autoCapitalize="words" autoComplete="given-name" returnKeyType="done" />
          <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: 22 }}>
            <Card accent padding={16}>
              <Text variant="micro" color="accent" style={{ marginBottom: 12 }}>
                YOUR STARTING PLAN
              </Text>
              {[
                ['flag', `${selected.length || 'Your'} focus area${selected.length === 1 ? '' : 's'}`],
                ['flame', habits.length ? `${habits.length} starter habit${habits.length === 1 ? '' : 's'}` : 'Add habits any time'],
                ['trophy', '3 daily challenges every day'],
                ['speedometer', 'A Life Score that tracks your week'],
              ].map(([icon, label], i) => (
                <Animated.View key={label} entering={FadeInDown.delay(250 + i * 80)} style={styles.perk}>
                  <Icon name={icon} size={16} color={t.accent} />
                  <Text variant="bodyMedium" color="secondary">
                    {label}
                  </Text>
                </Animated.View>
              ))}
            </Card>
          </Animated.View>
        </Animated.View>
      ) : null}

      <View style={styles.footer}>
        {step === 0 ? (
          <>
            <Button title="Get started" shimmer onPress={next} />
            <Button title="I already have an account" variant="ghost" onPress={() => finish('/(auth)/login')} />
          </>
        ) : step === 1 ? (
          <Button title="Continue" disabled={selected.length === 0} onPress={next} />
        ) : step === 2 ? (
          <Button title={habits.length ? `Add ${habits.length} habit${habits.length === 1 ? '' : 's'}` : 'Continue'} onPress={next} />
        ) : step === 3 ? (
          <Button title={time ? 'Turn on reminders' : 'Continue'} loading={busy} onPress={askReminders} />
        ) : (
          <>
            <Button title="Create account" icon="arrow-forward" shimmer loading={busy} onPress={() => finish('/(auth)/register')} />
            <Button title="I already have an account" variant="ghost" onPress={() => finish('/(auth)/login')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  dots: { flexDirection: 'row', gap: 6 },
  body: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 44, height: 230 },
  halo: { position: 'absolute', width: 380, height: 380 },
  floatChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.8%' },
  objective: { borderRadius: radius.lg, borderWidth: 1.5, padding: 16, gap: 14, minHeight: 112 },
  objIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tick: { position: 'absolute', top: 12, right: 12 },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1.5 },
  bell: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  footer: { gap: 6, paddingBottom: 12 },
});
