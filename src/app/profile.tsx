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
import { useI18n } from '@/i18n';
import { formatDuration } from '@/lib/date';
import { ACHIEVEMENTS, levelTitle } from '@/lib/gamification';
import { pickAndUploadAvatar } from '@/services/avatar';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

export default function Profile() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { displayName, avatarUrl } = useProfile();
  const email = useAuth((s) => s.email);
  const guest = useAuth((s) => s.guest);
  const isPro = useIsPro();
  const lvl = useLevelProgress();
  const stats = useLifetimeStats();
  const unlocked = useUnlockedKeys();
  const name = displayName || email?.split('@')[0] || tr('profile.you');

  return (
    <Screen>
      <Header title={tr('profile.title')} back right={<IconButton icon="settings-outline" label={tr('dashboard.settings')} onPress={() => router.push('/settings')} />} />

      <Card accent padding={22}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <PressableScale onPress={pickAndUploadAvatar} feedback="tap" accessibilityLabel={tr('profile.changePhoto')}>
            <Avatar name={name} uri={avatarUrl} size={92} />
            <View style={{ position: 'absolute', end: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.background }}>
              <Icon name="camera" size={14} color={t.onAccent} />
            </View>
          </PressableScale>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="title">{name}</Text>
              {isPro ? <ProBadge /> : null}
            </View>
            <Text variant="caption" color="secondary">
              {guest ? tr('profile.preview') : email}
            </Text>
          </View>
          <View style={{ width: '100%', gap: 8, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="heading">
                {tr('profile.levelTitle', { level: lvl.level, title: levelTitle(lvl.level) })}
              </Text>
              <Text variant="caption" color="secondary">
                {tr('common.xp', { count: lvl.xp })}
              </Text>
            </View>
            <ProgressBar value={lvl.ratio} height={10} />
            <Text variant="caption" color="secondary">
              {tr('profile.xpToLevel', { xp: lvl.needed - lvl.current, level: lvl.level + 1 })}
            </Text>
          </View>
        </View>
      </Card>

      {!isPro ? (
        <Card onPress={() => router.push('/paywall')} padding={16} style={{ marginTop: 12 }} accessibilityLabel={tr('profile.upgradeLabel')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={22} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{tr('profile.upgrade')}</Text>
              <Text variant="caption" color="secondary">
                {tr('profile.upgradeBody')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={t.textSecondary} />
          </View>
        </Card>
      ) : null}

      <SectionHeader title={tr('profile.statistics')} action={isPro ? tr('profile.advanced') : undefined} onAction={() => router.push('/analytics')} />
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="checkmark-done" value={stats.tasksCompleted} label={tr('profile.tasksDone')} />
          <StatTile icon="flame" value={stats.habitCheckins} label={tr('profile.checkins')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="trophy" value={tr('profile.days', { count: stats.bestStreak })} label={tr('profile.bestStreak')} />
          <StatTile icon="timer" value={formatDuration(stats.focusMinutes * 60)} label={tr('profile.focused')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="flag" value={stats.goalsCompleted} label={tr('profile.goalsAchieved')} />
          <StatTile icon="document-text" value={stats.notes + stats.journal} label={tr('profile.notesEntries')} />
        </View>
      </View>
      {!isPro ? (
        <PressableScale onPress={() => router.push('/analytics')} feedback="tap" style={{ marginTop: 12 }}>
          <Card padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="analytics" size={18} color={t.accent} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {tr('profile.advancedGate')}
              </Text>
              <ProBadge small />
            </View>
          </Card>
        </PressableScale>
      ) : null}

      <SectionHeader title={tr('profile.achievementsTitle', { count: unlocked.size, total: ACHIEVEMENTS.length })} action={tr('common.seeAll')} onAction={() => router.push('/achievements')} />
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
