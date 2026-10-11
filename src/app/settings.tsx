import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Platform, Switch, View } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header, IconButton, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProBadge } from '@/components/ui/ProBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { config, isSupabaseConfigured } from '@/lib/config';
import { deleteAccountData, signOut } from '@/services/auth';
import { ensureNotificationPermission, syncDailyReminder } from '@/services/notifications';
import { runSync } from '@/services/sync';
import { restorePurchases } from '@/services/purchases';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useIsPro } from '@/store/subscription';
import { useSync } from '@/store/sync';
import { THEMES, useTheme } from '@/theme';

function Row({ icon, title, subtitle, right, onPress }: { icon: string; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void }) {
  const t = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} feedback="tap" scaleTo={0.99}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ false: t.surfaceStrong, true: t.accentMuted }} thumbColor={value ? t.accent : '#FFFFFF'} />;
}

function Stepper({ value, onChange, min, max, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; unit: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon="remove" label="Decrease" size={34} onPress={() => onChange(Math.max(min, value - 1))} />
      <Text variant="bodyMedium" style={{ minWidth: 56, textAlign: 'center' }}>
        {value} {unit}
      </Text>
      <IconButton icon="add" label="Increase" size={34} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

export default function Settings() {
  const t = useTheme();
  const s = useSettings();
  const isPro = useIsPro();
  const email = useAuth((a) => a.email);
  const guest = useAuth((a) => a.guest);
  const sync = useSync();

  const confirm = (title: string, message: string, action: () => void) => {
    if (Platform.OS === 'web') return action();
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: title, style: 'destructive', onPress: action },
    ]);
  };

  return (
    <Screen>
      <Header title="Settings" back />

      <SectionHeader title="Appearance" />
      <Card padding={16}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Object.values(THEMES).map((th) => {
            const selected = s.themeId === th.id;
            const locked = th.pro && !isPro;
            return (
              <PressableScale
                key={th.id}
                feedback="tap"
                accessibilityLabel={`${th.name} theme${locked ? ', Pro' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => (locked ? router.push('/paywall?reason=themes') : s.set({ themeId: th.id }))}
                style={{ flex: 1, alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1.5, backgroundColor: selected ? t.accentSoft : t.surface, borderColor: selected ? t.accent : t.border }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.accent, alignItems: 'center', justifyContent: 'center', shadowColor: th.accent, shadowOpacity: th.glow * 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }}>
                  {locked ? <Icon name="lock-closed" size={16} color={th.onAccent} /> : selected ? <Icon name="checkmark" size={20} color={th.onAccent} /> : null}
                </View>
                <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {th.name}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </Card>

      <SectionHeader title="Notifications & feedback" />
      <Card padding={16}>
        <Row
          icon="notifications"
          title="Reminders"
          subtitle="Task and habit reminders"
          right={
            <Toggle
              label="Reminders"
              value={s.notifications}
              onChange={async (v) => {
                if (v && !(await ensureNotificationPermission())) return toast('Enable notifications in system settings first.');
                s.set({ notifications: v });
                void syncDailyReminder();
              }}
            />
          }
        />
        <Row
          icon="moon"
          title="Evening check-in"
          subtitle="Daily nudge at 8:30 PM"
          right={
            <Toggle
              label="Evening check-in"
              value={s.dailyReminder}
              onChange={(v) => {
                s.set({ dailyReminder: v });
                setTimeout(() => void syncDailyReminder(), 0);
              }}
            />
          }
        />
        <Row
          icon="stats-chart"
          title="Weekly report"
          subtitle="Sunday evening summary"
          right={
            <Toggle
              label="Weekly report"
              value={s.weeklyReport}
              onChange={(v) => {
                s.set({ weeklyReport: v });
                setTimeout(() => void syncDailyReminder(), 0);
              }}
            />
          }
        />
        <Row icon="phone-portrait" title="Haptics" subtitle="Tactile feedback" right={<Toggle label="Haptics" value={s.haptics} onChange={(v) => s.set({ haptics: v })} />} />
      </Card>

      <SectionHeader title="Focus" />
      <Card padding={16}>
        <Row icon="timer" title="Focus" right={<Stepper value={s.focusMinutes} min={5} max={120} unit="min" onChange={(v) => s.set({ focusMinutes: v })} />} />
        <Row icon="cafe" title="Short break" right={<Stepper value={s.shortBreakMinutes} min={1} max={30} unit="min" onChange={(v) => s.set({ shortBreakMinutes: v })} />} />
        <Row icon="bed" title="Long break" right={<Stepper value={s.longBreakMinutes} min={5} max={60} unit="min" onChange={(v) => s.set({ longBreakMinutes: v })} />} />
        <Row icon="repeat" title="Sessions per cycle" right={<Stepper value={s.sessionsUntilLongBreak} min={2} max={8} unit="" onChange={(v) => s.set({ sessionsUntilLongBreak: v })} />} />
      </Card>

      <SectionHeader title="Cloud sync" />
      <Card padding={16}>
        <Row
          icon="cloud"
          title={isPro ? 'Synced with your account' : 'Cloud synchronization'}
          subtitle={isPro ? (sync.syncing ? 'Syncing…' : sync.lastSyncAt ? `Last synced ${new Date(sync.lastSyncAt).toLocaleString()}` : 'Not synced yet') : 'Back up and use Life OS on every device'}
          right={isPro ? undefined : <ProBadge />}
          onPress={isPro ? undefined : () => router.push('/paywall?reason=sync')}
        />
        {isPro && !guest ? <Button title="Sync now" variant="secondary" size="sm" fullWidth={false} loading={sync.syncing} onPress={() => void runSync()} /> : null}
        {sync.error ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 8 }}>
            {sync.error}
          </Text>
        ) : null}
      </Card>

      <SectionHeader title="Subscription" />
      <Card padding={16}>
        <Row icon="sparkles" title={isPro ? 'Life OS Pro' : 'Free plan'} subtitle={isPro ? 'Thanks for supporting Life OS' : `Try free for ${config.trialDays} days, then from ${config.proPriceLabel}/month`} right={isPro ? <ProBadge /> : undefined} onPress={() => router.push(isPro ? '/pro' : '/paywall')} />
        <Row
          icon="refresh"
          title="Restore purchases"
          onPress={async () => {
            const r = await restorePurchases();
            toast(r.ok ? 'Pro restored.' : (r.error ?? 'Nothing to restore.'));
          }}
        />
      </Card>

      <SectionHeader title="Account" />
      <Card padding={16}>
        <Row icon="person" title={guest ? 'Preview mode' : (email ?? 'Signed in')} subtitle={guest ? 'Data stays on this device' : 'Account'} />
        <Row
          icon="log-out"
          title={guest ? 'Exit preview' : 'Sign out'}
          onPress={() =>
            confirm('Sign out', 'Data on this device will be cleared. Pro users can restore it by signing back in.', async () => {
              await signOut();
            })
          }
        />
        {isSupabaseConfigured && !guest ? (
          <Row
            icon="trash"
            title="Delete account"
            subtitle="Permanently remove your account and cloud data"
            onPress={() =>
              confirm('Delete account', 'This permanently deletes your account and all synced data. This cannot be undone.', async () => {
                const r = await deleteAccountData();
                if (!r.ok) toast(r.error);
              })
            }
          />
        ) : null}
      </Card>

      <SectionHeader title="About" />
      <Card padding={16}>
        <Row icon="shield-checkmark" title="Privacy policy" onPress={() => void Linking.openURL(config.privacyUrl)} />
        <Row icon="document-text" title="Terms of service" onPress={() => void Linking.openURL(config.termsUrl)} />
        <Row icon="mail" title="Contact support" subtitle={config.supportEmail} onPress={() => void Linking.openURL(`mailto:${config.supportEmail}?subject=Life%20OS%20support`)} />
      </Card>

      <Text variant="caption" color="tertiary" align="center" style={{ marginTop: 28, marginBottom: 12 }}>
        Life OS {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}
