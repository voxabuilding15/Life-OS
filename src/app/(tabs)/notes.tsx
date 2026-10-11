import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { useJournalData, useNotesData } from '@/hooks/useData';
import { useI18n } from '@/i18n';
import { formatDay, todayKey } from '@/lib/date';
import { MOODS } from '@/lib/mood';
import { useTheme } from '@/theme';
import { NOTE_CATEGORIES, type Note } from '@/types';

type Filter = 'All' | 'Favorites' | (typeof NOTE_CATEGORIES)[number];

function NoteCard({ note, index }: { note: Note; index: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(350)} layout={LinearTransition}>
      <Card onPress={() => router.push(`/note/${note.id}`)} padding={16} accessibilityLabel={note.title || tr('notes.untitled')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text content variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {note.title || tr('notes.untitled')}
          </Text>
          {note.isFavorite ? <Icon name="star" size={16} color={t.accent} /> : null}
        </View>
        {note.body ? (
          <Text content variant="body" color="secondary" numberOfLines={2} style={{ marginTop: 6 }}>
            {note.body}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Text variant="micro" color="accent">
            {tr(`categories.note.${note.category}`).toUpperCase()}
          </Text>
          <Text variant="micro" color="tertiary">
            · {formatDay(todayKey(new Date(note.updatedAt)))}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function Notes() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [tab, setTab] = useState<'notes' | 'journal'>('notes');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [shown, setShown] = useState(30);
  const notes = useNotesData();
  const journal = useJournalData();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => (filter === 'All' ? true : filter === 'Favorites' ? n.isFavorite : n.category === filter))
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [notes, query, filter]);

  const entries = useMemo(() => [...journal].sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1)), [journal]);
  const today = todayKey();
  const todayEntry = entries.find((e) => e.entryDate === today);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={110}>
        <Header title={tab === 'notes' ? tr('tabs.notes') : tr('notes.journal')} subtitle={tab === 'notes' ? tr('notes.countLabel', { count: notes.length }) : tr('notes.entriesLabel', { count: entries.length })} />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'notes', label: tr('notes.tabNotes') },
            { value: 'journal', label: tr('notes.tabJournal') },
          ]}
        />

        {tab === 'notes' ? (
          <View style={{ marginTop: 16, gap: 14 }}>
            <Input value={query} onChangeText={setQuery} placeholder={tr('notes.search')} icon="search" returnKeyType="search" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
              {(['All', 'Favorites', ...NOTE_CATEGORIES] as Filter[]).map((c) => (
                <Chip key={c} label={c === 'All' ? tr('notes.filterAll') : c === 'Favorites' ? tr('notes.filterFavorites') : tr(`categories.note.${c}`)} icon={c === 'Favorites' ? 'star' : undefined} selected={filter === c} onPress={() => setFilter(c)} />
              ))}
            </ScrollView>
            <View style={{ gap: 12 }}>
              {filtered.slice(0, shown).map((n, i) => (
                <NoteCard key={n.id} note={n} index={i} />
              ))}
              {filtered.length > shown ? <Button title={tr('common.showMore', { count: filtered.length - shown })} variant="ghost" size="md" onPress={() => setShown((c) => c + 30)} /> : null}
            </View>
            {filtered.length === 0 ? (
              notes.length === 0 ? (
                <EmptyState icon="document-text-outline" title={tr('notes.emptyTitle')} message={tr('notes.emptyBody')} actionLabel={tr('notes.new')} onAction={() => router.push('/note/new')} satellites={['bulb', 'bookmark', 'star']} hint={tr('notes.emptyHint')} />
              ) : (
                <EmptyState icon="search" title={tr('notes.noMatchesTitle')} message={tr('notes.noMatchesBody')} />
              )
            ) : null}
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Card accent onPress={() => router.push(`/journal/${today}`)} padding={18} accessibilityLabel={tr('notes.writeToday')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={todayEntry ? (MOODS[todayEntry.mood - 1]?.icon ?? 'create') : 'create'} size={24} color={t.onAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{todayEntry ? tr('notes.todayEntry') : tr('notes.howWasToday')}</Text>
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    {todayEntry ? todayEntry.body || tr('notes.tapToAdd') : tr('notes.reflectPrompt')}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={t.textSecondary} />
              </View>
            </Card>
            {entries
              .filter((e) => e.entryDate !== today)
              .map((e, i) => (
                <Animated.View key={e.id} entering={FadeInDown.delay(Math.min(i, 8) * 50)}>
                  <Card onPress={() => router.push(`/journal/${e.entryDate}`)} padding={16}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Icon name={MOODS[e.mood - 1]?.icon ?? 'happy-outline'} size={22} color={t.accent} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium">{formatDay(e.entryDate)}</Text>
                        <Text variant="caption" color="secondary" numberOfLines={1}>
                          {e.body || tr(`mood.${e.mood}`)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))}
            {entries.length === 0 ? <EmptyState icon="book-outline" title={tr('notes.journalEmptyTitle')} message={tr('notes.journalEmptyBody')} actionLabel={tr('notes.journalEmptyAction')} onAction={() => router.push(`/journal/${todayKey()}`)} satellites={['heart', 'moon', 'sunny']} hint={tr('notes.journalEmptyHint')} /> : null}
          </View>
        )}
      </Screen>
      {tab === 'notes' ? <Fab onPress={() => router.push('/note/new')} label={tr('notes.new')} /> : null}
    </View>
  );
}
