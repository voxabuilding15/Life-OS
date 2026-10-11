import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AchievementBadge } from '@/components/features/AchievementBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Header, IconButton, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProBadge } from '@/components/ui/ProBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useLevelProgress } from '@/hooks/useData';
import { useLifetimeStats, useUnlockedKeys } from '@/hooks/useStats';
import { formatDuration } from '@/lib/date';
import { ACHIEVEMENTS, levelTitle } from '@/lib/gamification';
import { pickAndUploadAvatar } from '@/services/avatar';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

export default function Profile() {
  const t = useTheme();
  const { displayName, avatarUrl } = useProfile();
  const email = useAuth((s) => s.email);
  const guest = useAuth((s) => s.guest);
  const isPro = useIsPro();
  const lvl = useLevelProgress();
  const stats = useLifetimeStats();
  const unlocked = useUnlockedKeys();
  const name = displayName || email?.split('@')[0] || 'You';

  return (
    <Screen>
      <Header title="Profile" back right={<IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />} />

      <Card accent padding={22}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <PressableScale onPress={pickAndUploadAvatar} feedback="tap" accessibilityLabel="Change profile picture">
            <Avatar name={name} uri={avatarUrl} size={92} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.background }}>
              <Icon name="camera" size={14} color={t.onAccent} />
            </View>
          </PressableScale>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="title">{name}</Text>
              {isPro ? <ProBadge /> : null}
            </View>
            <Text variant="caption" color="secondary">
              {guest ? 'Preview mode' : email}
            </Text>
          </View>
          <View style={{ width: '100%', gap: 8, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="heading">
                Level {lvl.level} · <Text variant="heading" color="accent">{levelTitle(lvl.level)}</Text>
              </Text>
              <Text variant="caption" color="secondary">
                {lvl.xp} XP
              </Text>
            </View>
            <ProgressBar value={lvl.ratio} height={10} />
            <Text variant="caption" color="secondary">
              {lvl.needed - lvl.current} XP to level {lvl.level + 1}
            </Text>
          </View>
        </View>
      </Card>

      {!isPro ? (
        <Card onPress={() => router.push('/paywall')} padding={16} style={{ marginTop: 12 }} accessibilityLabel="Upgrade to Life OS Pro">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={22} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">Upgrade to Pro</Text>
              <Text variant="caption" color="secondary">
                Unlimited habits, analytics, cloud sync
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={t.textSecondary} />
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Statistics" action={isPro ? 'Advanced' : undefined} onAction={() => router.push('/analytics')} />
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="checkmark-done" value={stats.tasksCompleted} label="Tasks done" />
          <StatTile icon="flame" value={stats.habitCheckins} label="Check-ins" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="trophy" value={`${stats.bestStreak}d`} label="Best streak" />
          <StatTile icon="timer" value={formatDuration(stats.focusMinutes * 60)} label="Focused" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="flag" value={stats.goalsCompleted} label="Goals achieved" />
          <StatTile icon="document-text" value={stats.notes + stats.journal} label="Notes & entries" />
        </View>
      </View>
      {!isPro ? (
        <PressableScale onPress={() => router.push('/analytics')} feedback="tap" style={{ marginTop: 12 }}>
          <Card padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="analytics" size={18} color={t.accent} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                Advanced analytics & reports
              </Text>
              <ProBadge small />
            </View>
          </Card>
        </PressableScale>
      ) : null}

      <SectionHeader title={`Achievements · ${unlocked.size}/${ACHIEVEMENTS.length}`} action="See all" onAction={() => router.push('/achievements')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ marginHorizontal: -20 }} contentInset={{ left: 20, right: 20 }}>
        <View style={{ width: 10 }} />
        {ACHIEVEMENTS.slice(0, 8).map((a) => (
          <View key={a.key} style={{ width: 110 }}>
            <AchievementBadge def={a} unlocked={unlocked.has(a.key)} locked={a.pro && !isPro} />
          </View>
        ))}
        <View style={{ width: 10 }} />
      </ScrollView>
    </Screen>
  );
}
