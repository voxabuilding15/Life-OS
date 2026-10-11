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
import { signUp, validateEmail } from '@/services/auth';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useTheme } from '@/theme';

export default function Register() {
  const t = useTheme();
  const [name, setName] = useState(useProfile.getState().displayName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Tell us what to call you.';
    if (!validateEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
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
      <AuthShell title="Check your inbox" subtitle={`We sent a confirmation link to ${email.trim()}. Open it, then sign in.`}>
        <Animated.View entering={FadeInDown} style={{ alignItems: 'center', padding: 24 }}>
          <Icon name="mail-open-outline" size={44} color={t.accent} />
        </Animated.View>
        <Button title="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="One account. Every device. Everything you're building." back>
      <Input label="Name" value={name} onChangeText={setName} placeholder="Your first name" icon="person-outline" autoCapitalize="words" autoComplete="given-name" error={errors.name} />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" icon="lock-closed-outline" secure autoCapitalize="none" autoComplete="new-password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
      {errors.form ? (
        <Text variant="caption" color="secondary" align="center" accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      ) : null}
      <Button title="Create account" onPress={submit} loading={loading} />
      {allowPreview ? (
        <Button
          title="Continue in preview mode"
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
          Already have an account?
        </Text>
        <Text variant="bodyMedium" color="accent" onPress={() => router.replace('/(auth)/login')} accessibilityRole="link">
          Sign in
        </Text>
      </View>
    </AuthShell>
  );
}
