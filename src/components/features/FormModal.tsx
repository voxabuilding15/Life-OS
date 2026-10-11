import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/Header';
import { Screen } from '../ui/Screen';
import { Text } from '../ui/Text';
import { router } from 'expo-router';

interface Props {
  title: string;
  children: ReactNode;
  saveLabel?: string;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
}

/** Shared chrome for create/edit modals: close button, title, scrolling form, sticky actions. */
export function FormModal({ title, children, saveLabel = 'Save', onSave, saving, disabled, onDelete, deleteLabel = 'Delete' }: Props) {
  return (
    <Screen keyboard bottomInset={16}>
      <View style={styles.head}>
        <Text variant="title" style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </Text>
        <IconButton icon="close" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <View style={styles.form}>{children}</View>
      <View style={styles.actions}>
        <Button title={saveLabel} onPress={onSave} loading={saving} disabled={disabled} />
        {onDelete ? <Button title={deleteLabel} variant="ghost" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text variant="micro" color="tertiary" style={{ marginLeft: 4 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  form: { gap: 22, flexGrow: 1 },
  actions: { gap: 4, marginTop: 28 },
});
