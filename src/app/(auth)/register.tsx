import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { allowPreview } from '@/lib/config';
import { useI18n } from '@/i18n';
import { signUp, validateEmail } from '@/services/auth';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useTheme } from '@/theme';

export default function Register() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [name, setName] = useState(useProfile.getState().displayName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = tr('auth.validation.name');
    if (!validateEmail(email)) next.email = tr('auth.validation.email');
    if (password.length < 8) next.password = tr('auth.validation.password8');
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await signUp(email, password, name);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    if (res.needsConfirmation) setConfirm(true);
  };

  if (confirm) {
    return (
      <AuthShell title={tr('auth.register.checkTitle')} subtitle={tr('auth.register.checkBody', { email: email.trim() })}>
        <Animated.View entering={FadeInDown} style={{ alignItems: 'center', padding: 24 }}>
          <Icon name="mail-open-outline" size={44} color={t.accent} />
        </Animated.View>
        <Button title={tr('auth.register.goSignIn')} onPress={() => router.replace('/(auth)/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={tr('auth.register.title')} subtitle={tr('auth.register.subtitle')} back>
      <Input label={tr('auth.name')} value={name} onChangeText={setName} placeholder={tr('auth.firstName')} icon="person-outline" autoCapitalize="words" autoComplete="given-name" error={errors.name} />
      <Input label={tr('auth.email')} value={email} onChangeText={setEmail} placeholder={tr('auth.emailPlaceholder')} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Input label={tr('auth.password')} value={password} onChangeText={setPassword} placeholder={tr('auth.passwordHint')} icon="lock-closed-outline" secure autoCapitalize="none" autoComplete="new-password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
      {errors.form ? (
        <Text variant="caption" color="secondary" align="center" accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      ) : null}
      <Button title={tr('auth.createAccount')} onPress={submit} loading={loading} />
      {allowPreview ? (
        <Button
          title={tr('auth.previewMode')}
          variant="secondary"
          icon="eye-outline"
          onPress={() => {
            useProfile.getState().setProfile({ displayName: name.trim() || useProfile.getState().displayName });
            useAuth.getState().enterGuest();
          }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        <Text variant="body" color="secondary">
          {tr('auth.register.have')}
        </Text>
        <Text variant="bodyMedium" color="accent" onPress={() => router.replace('/(auth)/login')} accessibilityRole="link">
          {tr('auth.signIn')}
        </Text>
      </View>
    </AuthShell>
  );
}
