import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function NotFound() {
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState icon="compass-outline" title="Page not found" message="That screen doesn't exist or has moved." />
        <Button title="Back home" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
