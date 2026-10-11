import { router } from 'expo-router';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState icon="compass-outline" title={t('common.notFoundTitle')} message={t('common.notFoundBody')} />
        <Button title={t('common.backHome')} variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
