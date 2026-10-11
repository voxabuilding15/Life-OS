import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { allowPreview } from '@/lib/config';
import { useI18n } from '@/i18n';
import { signIn, validateEmail } from '@/services/auth';
import { useAuth } from '@/store/auth';

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!validateEmail(email)) next.email = t('auth.validation.email');
    if (password.length < 6) next.password = t('auth.validation.password6');
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) setErrors({ form: res.error });
  };

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} placeholder={t('auth.passwordPlaceholder')} icon="lock-closed-outline" secure autoCapitalize="none" autoComplete="password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
      <Link href="/(auth)/forgot-password" asChild>
        <Text variant="caption" color="accent" style={{ alignSelf: 'flex-end', fontFamily: 'Inter_600SemiBold' }} accessibilityRole="link">
          {t('auth.forgot')}
        </Text>
      </Link>
      {errors.form ? (
        <Text variant="caption" color="secondary" align="center" accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      ) : null}
      <Button title={t('auth.signIn')} onPress={submit} loading={loading} />
      {allowPreview ? <Button title={t('auth.previewMode')} variant="secondary" icon="eye-outline" onPress={() => useAuth.getState().enterGuest()} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        <Text variant="body" color="secondary">
          {t('auth.login.newHere')}
        </Text>
        <Text variant="bodyMedium" color="accent" onPress={() => router.replace('/(auth)/register')} accessibilityRole="link">
          {t('auth.createAccount')}
        </Text>
      </View>
    </AuthShell>
  );
}
