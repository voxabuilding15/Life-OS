import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Platform, Switch, View } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '@/components/ui/Button';
import { LANGUAGES, useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Header, IconButton, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProBadge } from '@/components/ui/ProBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { config, isSupabaseConfigured } from '@/lib/config';
import { setAppLanguage } from '@/services/actions';
import { dateTime } from '@/i18n/format';
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
  const { t: tr } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon="remove" label={tr('settings.decrease')} size={34} onPress={() => onChange(Math.max(min, value - 1))} />
      <Text variant="bodyMedium" style={{ minWidth: 56, textAlign: 'center' }}>
        {unit ? `${value} ${unit}` : value}
      </Text>
      <IconButton icon="add" label={tr('settings.increase')} size={34} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

export default function Settings() {
  const t = useTheme();
  const { t: tr, locale } = useI18n();
  const s = useSettings();
  const isPro = useIsPro();
  const email = useAuth((a) => a.email);
  const guest = useAuth((a) => a.guest);
  const sync = useSync();

  const confirm = (title: string, message: string, action: () => void) => {
    if (Platform.OS === 'web') return action();
    Alert.alert(title, message, [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: title, style: 'destructive', onPress: action },
    ]);
  };

  return (
    <Screen>
      <Header title={tr('settings.title')} back />

      <SectionHeader title={tr('settings.language')} />
      <Card padding={8}>
        {LANGUAGES.map((l) => (
          <Row
            key={l.code}
            icon="language"
            title={`${l.flag}  ${l.native}`}
            right={locale === l.code ? <Icon name="checkmark-circle" size={22} color={t.accent} /> : undefined}
            onPress={() => void setAppLanguage(l.code)}
          />
        ))}
      </Card>

      <SectionHeader title={tr('settings.appearance')} />
      <Card padding={16}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Object.values(THEMES).map((th) => {
            const selected = s.themeId === th.id;
            const locked = th.pro && !isPro;
            return (
              <PressableScale
                key={th.id}
                feedback="tap"
                accessibilityLabel={tr(locked ? 'settings.themeLabelPro' : 'settings.themeLabel', { name: tr(`themes.${th.id}.name`) })}
                accessibilityState={{ selected }}
                onPress={() => (locked ? router.push('/paywall?reason=themes') : s.set({ themeId: th.id }))}
                style={{ flex: 1, alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1.5, backgroundColor: selected ? t.accentSoft : t.surface, borderColor: selected ? t.accent : t.border }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.accent, alignItems: 'center', justifyContent: 'center', shadowColor: th.accent, shadowOpacity: th.glow * 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }}>
                  {locked ? <Icon name="lock-closed" size={16} color={th.onAccent} /> : selected ? <Icon name="checkmark" size={20} color={th.onAccent} /> : null}
                </View>
                <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {tr(`themes.${th.id}.name`)}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </Card>

      <SectionHeader title={tr('settings.notifications')} />
      <Card padding={16}>
        <Row
          icon="notifications"
          title={tr('settings.reminders')}
          subtitle={tr('settings.remindersBody')}
          right={
            <Toggle
              label={tr('settings.reminders')}
              value={s.notifications}
              onChange={async (v) => {
                if (v && !(await ensureNotificationPermission())) return toast(tr('settings.enableFirst'));
                s.set({ notifications: v });
                void syncDailyReminder();
              }}
            />
          }
        />
        <Row
          icon="moon"
          title={tr('settings.evening')}
          subtitle={tr('settings.eveningBody')}
          right={
            <Toggle
              label={tr('settings.evening')}
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
          title={tr('settings.weekly')}
          subtitle={tr('settings.weeklyBody')}
          right={
            <Toggle
              label={tr('settings.weekly')}
              value={s.weeklyReport}
              onChange={(v) => {
                s.set({ weeklyReport: v });
                setTimeout(() => void syncDailyReminder(), 0);
              }}
            />
          }
        />
        <Row icon="phone-portrait" title={tr('settings.haptics')} subtitle={tr('settings.hapticsBody')} right={<Toggle label={tr('settings.haptics')} value={s.haptics} onChange={(v) => s.set({ haptics: v })} />} />
      </Card>

      <SectionHeader title={tr('settings.focusSection')} />
      <Card padding={16}>
        <Row icon="timer" title={tr('settings.focusRow')} right={<Stepper value={s.focusMinutes} min={5} max={120} unit={tr('settings.minUnit')} onChange={(v) => s.set({ focusMinutes: v })} />} />
        <Row icon="cafe" title={tr('settings.shortBreak')} right={<Stepper value={s.shortBreakMinutes} min={1} max={30} unit={tr('settings.minUnit')} onChange={(v) => s.set({ shortBreakMinutes: v })} />} />
        <Row icon="bed" title={tr('settings.longBreak')} right={<Stepper value={s.longBreakMinutes} min={5} max={60} unit={tr('settings.minUnit')} onChange={(v) => s.set({ longBreakMinutes: v })} />} />
        <Row icon="repeat" title={tr('settings.sessionsPerCycle')} right={<Stepper value={s.sessionsUntilLongBreak} min={2} max={8} unit="" onChange={(v) => s.set({ sessionsUntilLongBreak: v })} />} />
      </Card>

      <SectionHeader title={tr('settings.cloud')} />
      <Card padding={16}>
        <Row
          icon="cloud"
          title={isPro ? tr('settings.cloudSynced') : tr('settings.cloudFeature')}
          subtitle={isPro ? (sync.syncing ? tr('settings.syncing') : sync.lastSyncAt ? tr('settings.lastSynced', { date: dateTime(new Date(sync.lastSyncAt)) }) : tr('settings.notSynced')) : tr('settings.cloudPitch')}
          right={isPro ? undefined : <ProBadge />}
          onPress={isPro ? undefined : () => router.push('/paywall?reason=sync')}
        />
        {isPro && !guest ? <Button title={tr('settings.syncNow')} variant="secondary" size="sm" fullWidth={false} loading={sync.syncing} onPress={() => void runSync()} /> : null}
        {sync.error ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 8 }}>
            {sync.error}
          </Text>
        ) : null}
      </Card>

      <SectionHeader title={tr('settings.subscription')} />
      <Card padding={16}>
        <Row icon="sparkles" title={isPro ? tr('pro.title') : tr('settings.freePlan')} subtitle={isPro ? tr('settings.proThanks') : tr('settings.trialPitch', { days: config.trialDays, price: config.proPriceLabel })} right={isPro ? <ProBadge /> : undefined} onPress={() => router.push(isPro ? '/pro' : '/paywall')} />
        <Row
          icon="refresh"
          title={tr('settings.restore')}
          onPress={async () => {
            const r = await restorePurchases();
            toast(r.ok ? tr('settings.proRestored') : (r.error ?? tr('paywallScreen.nothingToRestore')));
          }}
        />
      </Card>

      <SectionHeader title={tr('settings.account')} />
      <Card padding={16}>
        <Row icon="person" title={guest ? tr('settings.previewMode') : (email ?? tr('settings.signedIn'))} subtitle={guest ? tr('settings.previewBody') : tr('settings.accountRow')} />
        <Row
          icon="log-out"
          title={guest ? tr('settings.exitPreview') : tr('settings.signOut')}
          onPress={() =>
            confirm(tr('settings.signOut'), tr('settings.signOutBody'), async () => {
              await signOut();
            })
          }
        />
        {isSupabaseConfigured && !guest ? (
          <Row
            icon="trash"
            title={tr('settings.deleteAccount')}
            subtitle={tr('settings.deleteBody')}
            onPress={() =>
              confirm(tr('settings.deleteAccount'), tr('settings.deleteConfirm'), async () => {
                const r = await deleteAccountData();
                if (!r.ok) toast(r.error);
              })
            }
          />
        ) : null}
      </Card>

      <SectionHeader title={tr('settings.about')} />
      <Card padding={16}>
        <Row icon="shield-checkmark" title={tr('settings.privacy')} onPress={() => void Linking.openURL(config.privacyUrl)} />
        <Row icon="document-text" title={tr('settings.terms')} onPress={() => void Linking.openURL(config.termsUrl)} />
        <Row icon="mail" title={tr('settings.support')} subtitle={config.supportEmail} onPress={() => void Linking.openURL(`mailto:${config.supportEmail}?subject=${encodeURIComponent(tr('settings.supportSubject'))}`)} />
      </Card>

      <Text variant="caption" color="tertiary" align="center" style={{ marginTop: 28, marginBottom: 12 }}>
        {tr('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}
