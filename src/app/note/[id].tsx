import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/Header';
import { useI18n } from '@/i18n';
import { saveNote } from '@/services/actions';
import { useNotes } from '@/store/entities';
import { NOTE_CATEGORIES, type NoteCategory } from '@/types';

export default function NoteEditor() {
  const { t: tr } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = id && id !== 'new' ? useNotes.getState().items[id] : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [category, setCategory] = useState<NoteCategory>(existing?.category ?? 'Ideas');
  const [fav, setFav] = useState(existing?.isFavorite ?? false);

  const save = () => {
    if (!title.trim() && !body.trim()) return router.back();
    const note = saveNote(existing?.id ?? null, { title: title.trim(), body, category });
    if (note && fav !== note.isFavorite) useNotes.getState().update(note.id, { isFavorite: fav });
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    const run = () => {
      useNotes.getState().remove(existing.id);
      router.back();
    };
    if (Platform.OS === 'web') return run();
    Alert.alert(tr('notes.deleteTitle'), tr('notes.deleteBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('common.delete'), style: 'destructive', onPress: run },
    ]);
  };

  return (
    <FormModal title={existing ? tr('notes.edit') : tr('notes.new')} saveLabel={tr('notes.save')} onSave={save} onDelete={existing ? remove : undefined} deleteLabel={tr('notes.deleteNote')}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Input label={tr('notes.titleLabel')} value={title} onChangeText={setTitle} placeholder={tr('notes.untitled')} autoFocus={!existing} />
        </View>
        <IconButton icon={fav ? 'star' : 'star-outline'} label={fav ? tr('notes.removeFavorite') : tr('notes.addFavorite')} active={fav} onPress={() => setFav(!fav)} size={54} />
      </View>
      <Input label={tr('notes.noteLabel')} value={body} onChangeText={setBody} placeholder={tr('notes.bodyPlaceholder')} multiline style={{ minHeight: 180 }} />
      <Field label={tr('notes.category')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {NOTE_CATEGORIES.map((c) => (
            <Chip key={c} label={tr(`categories.note.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Field>
    </FormModal>
  );
}
