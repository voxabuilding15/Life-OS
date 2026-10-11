import { router } from 'expo-router';
import { useState } from 'react';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { sendPasswordReset, validateEmail } from '@/services/auth';

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!validateEmail(email)) return setError(t('auth.validation.email'));
    setError(null);
    setLoading(true);
    const res = await sendPasswordReset(email);
    setLoading(false);
    if (res.ok) setSent(true);
    else setError(res.error);
  };

  return (
    <AuthShell title={t('auth.forgotScreen.title')} subtitle={t('auth.forgotScreen.subtitle')} back>
      {sent ? (
        <Text variant="body" color="accent" accessibilityLiveRegion="polite">
          {t('auth.forgotScreen.sent', { email: email.trim() })}
        </Text>
      ) : (
        <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={error} onSubmitEditing={submit} />
      )}
      {sent ? <Button title={t('auth.forgotScreen.back')} onPress={() => router.replace('/(auth)/login')} /> : <Button title={t('auth.forgotScreen.send')} onPress={submit} loading={loading} />}
    </AuthShell>
  );
}
