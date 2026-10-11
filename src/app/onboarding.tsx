import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Floating } from '@/components/ui/Floating';
import { Glow } from '@/components/ui/Glow';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { formatHm } from '@/components/ui/TimePicker';
import { LANGUAGES, useI18n } from '@/i18n';
import { STARTER_HABITS } from '@/lib/habitIcons';
import { haptic } from '@/lib/haptics';
import { createHabit, setAppLanguage } from '@/services/actions';
import { ensureNotificationPermission, syncDailyReminder } from '@/services/notifications';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { radius, springs, useTheme } from '@/theme';
import { OBJECTIVES, type ObjectiveId } from '@/types';
import { config } from '@/lib/config';

const STEPS = 5;
const REMINDER_TIMES = [
  { time: '08:00', key: 'morning', icon: 'sunny' },
  { time: '13:00', key: 'midday', icon: 'partly-sunny' },
  { time: '20:30', key: 'evening', icon: 'moon' },
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
  const { t: tr, locale, rtl } = useI18n();
  const profile = useProfile();
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<ObjectiveId[]>(profile.objectives);
  const [habits, setHabits] = useState<string[]>([]); // habit idea ids
  const [time, setTime] = useState<(typeof REMINDER_TIMES)[number]['time'] | null>('20:30');
  const [name, setName] = useState(profile.displayName);
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    return selected
      .flatMap((o) => STARTER_HABITS[o] ?? [])
      .filter((h) => !seen.has(h.id) && seen.add(h.id))
      .slice(0, 8);
  }, [selected]);

  const toggleObjective = (id: ObjectiveId) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleHabit = (id: string) =>
    setHabits((h) => {
      if (h.includes(id)) return h.filter((x) => x !== id);
      if (h.length >= config.freeHabitLimit) {
        haptic.warning();
        return h;
      }
      return [...h, id];
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
    for (const id of habits) {
      const h = suggestions.find((s) => s.id === id);
      if (h) createHabit({ name: tr(`starterHabits.${h.id}`), icon: h.icon, reminderTime: null });
    }
    profile.setProfile({ displayName: name.trim(), objectives: selected, onboarded: true });
    void syncDailyReminder();
    setBusy(false);
    router.replace(target);
  };

  const enter = (rtl ? FadeInLeft : FadeInRight).duration(380);
  const exit = (rtl ? FadeOutRight : FadeOutLeft).duration(180);

  return (
    <Screen scroll={false} keyboard>
      <View style={styles.top}>
        <View style={{ width: 60 }}>{step > 0 ? <Text variant="caption" color="secondary" onPress={back} accessibilityRole="button">{tr('common.back')}</Text> : null}</View>
        <View style={styles.dots}>
          {Array.from({ length: STEPS }, (_, i) => (
            <Dot key={i} active={i === step} done={i < step} />
          ))}
        </View>
        <View style={{ width: 60, alignItems: 'flex-end' }}>
          {step === 2 || step === 3 ? (
            <Text variant="caption" color="secondary" onPress={step === 2 ? next : () => (setTime(null), next())} accessibilityRole="button">
              {tr('common.skip')}
            </Text>
          ) : null}
        </View>
      </View>

      {step === 0 ? (
        <Animated.View key="s0" entering={enter} exiting={exit} style={styles.body}>
          <View style={styles.langRow} accessibilityRole="radiogroup" accessibilityLabel={tr('onboarding.language')}>
            {LANGUAGES.map((l) => (
              <Chip key={l.code} label={`${l.flag}  ${l.native}`} selected={locale === l.code} onPress={() => void setAppLanguage(l.code)} />
            ))}
          </View>
          <View style={styles.hero}>
            <View style={styles.halo} pointerEvents="none">
              <Glow size={380} intensity={0.55} />
            </View>
            <Floating distance={4} duration={2600}>
              <Logo size={132} />
            </Floating>
            <FloatingChip icon="flame" label={tr('onboarding.chipStreak')} style={{ start: 0, top: 18 }} delay={0} />
            <FloatingChip icon="checkmark-circle" label={tr('onboarding.chipDone')} style={{ end: 0, top: 54 }} delay={300} />
            <FloatingChip icon="speedometer" label={tr('onboarding.chipScore')} style={{ start: 18, bottom: 6 }} delay={600} />
            <FloatingChip icon="flash" label={tr('onboarding.chipXp')} style={{ end: 14, bottom: 26 }} delay={900} />
          </View>
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ gap: 14 }}>
            <Text variant="display" style={{ fontSize: 44, lineHeight: 48 }}>
              {tr('onboarding.titleLine1')}{'\n'}
              <Text variant="display" color="accent" style={{ fontSize: 44, lineHeight: 48 }}>
                {tr('onboarding.titleLine2')}
              </Text>
            </Text>
            <Text variant="body" color="secondary" style={{ fontSize: 17, lineHeight: 25 }}>
              {tr('onboarding.welcomeBody')}
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="s1" entering={enter} exiting={exit} style={styles.body}>
          <Text variant="title">{tr('onboarding.improveTitle')}</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 22 }}>
            {tr('onboarding.improveBody')}
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
                      {tr(`onboarding.objectives.${o.id}`)}
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
          <Text variant="title">{tr('onboarding.habitsTitle')}</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 18 }}>
            {tr('onboarding.habitsBody', { count: config.freeHabitLimit })}
          </Text>
          <View style={{ gap: 10 }}>
            {suggestions.map((h, i) => {
              const on = habits.includes(h.id);
              return (
                <Animated.View key={h.id} entering={(rtl ? FadeInRight : FadeInLeft).delay(i * 50).duration(350)} layout={LinearTransition}>
                  <PressableScale onPress={() => toggleHabit(h.id)} feedback="tap" accessibilityState={{ selected: on }} style={[styles.habit, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}>
                    <View style={[styles.objIcon, { width: 38, height: 38, backgroundColor: on ? t.accent : t.surfaceStrong }]}>
                      <Icon name={h.icon} size={18} color={on ? t.onAccent : t.textSecondary} />
                    </View>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      {tr(`starterHabits.${h.id}`)}
                    </Text>
                    <Icon name={on ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={on ? t.accent : t.textTertiary} />
                  </PressableScale>
                </Animated.View>
              );
            })}
            {suggestions.length === 0 ? (
              <Text variant="body" color="tertiary">
                {tr('onboarding.habitsLater')}
              </Text>
            ) : null}
          </View>
          <Text variant="caption" color="tertiary" style={{ marginTop: 14 }}>
            {tr('onboarding.habitsSelected', { count: habits.length, max: config.freeHabitLimit })}
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
            {tr('onboarding.nudgeTitle')}
          </Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 20 }}>
            {tr('onboarding.nudgeBody')}
          </Text>
          <View style={{ gap: 10 }}>
            {REMINDER_TIMES.map((r) => {
              const on = time === r.time;
              return (
                <PressableScale key={r.time} onPress={() => setTime(r.time)} feedback="tap" accessibilityState={{ selected: on }} style={[styles.habit, { backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }]}>
                  <Icon name={r.icon} size={22} color={on ? t.accent : t.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{tr(`onboarding.${r.key}`)}</Text>
                    <Text variant="caption" color="secondary">
                      {tr('onboarding.around', { time: formatHm(r.time) })}
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
          <Text variant="title">{tr('onboarding.nameTitle')}</Text>
          <Text variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 20 }}>
            {tr('onboarding.nameBody')}
          </Text>
          <Input value={name} onChangeText={setName} placeholder={tr('auth.firstName')} icon="person-outline" autoCapitalize="words" autoComplete="given-name" returnKeyType="done" />
          <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: 22 }}>
            <Card accent padding={16}>
              <Text variant="micro" color="accent" style={{ marginBottom: 12 }}>
                {tr('onboarding.plan')}
              </Text>
              {[
                ['flag', selected.length ? tr('onboarding.planAreas', { count: selected.length }) : tr('onboarding.planYourAreas')],
                ['flame', habits.length ? tr('onboarding.planHabits', { count: habits.length }) : tr('onboarding.planHabitsNone')],
                ['trophy', tr('onboarding.planChallenges')],
                ['speedometer', tr('onboarding.planScore')],
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
            <Button title={tr('onboarding.getStarted')} shimmer onPress={next} />
            <Button title={tr('onboarding.haveAccount')} variant="ghost" onPress={() => finish('/(auth)/login')} />
          </>
        ) : step === 1 ? (
          <Button title={tr('common.continue')} disabled={selected.length === 0} onPress={next} />
        ) : step === 2 ? (
          <Button title={habits.length ? tr('onboarding.addHabits', { count: habits.length }) : tr('common.continue')} onPress={next} />
        ) : step === 3 ? (
          <Button title={time ? tr('onboarding.turnOn') : tr('common.continue')} loading={busy} onPress={askReminders} />
        ) : (
          <>
            <Button title={tr('auth.createAccount')} icon="arrow-forward" shimmer loading={busy} onPress={() => finish('/(auth)/register')} />
            <Button title={tr('onboarding.haveAccount')} variant="ghost" onPress={() => finish('/(auth)/login')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
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
  tick: { position: 'absolute', top: 12, end: 12 },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1.5 },
  bell: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  footer: { gap: 6, paddingBottom: 12 },
});
