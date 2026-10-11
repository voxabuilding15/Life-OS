import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { isSupabaseConfigured } from '@/lib/config';
import { signIn, validateEmail } from '@/services/auth';
import { useAuth } from '@/store/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!validateEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) setErrors({ form: res.error });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Your password" icon="lock-closed-outline" secure autoCapitalize="none" autoComplete="password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
      <Link href="/(auth)/forgot-password" asChild>
        <Text variant="caption" color="accent" style={{ alignSelf: 'flex-end', fontFamily: 'Inter_600SemiBold' }} accessibilityRole="link">
          Forgot password?
        </Text>
      </Link>
      {errors.form ? (
        <Text variant="caption" color="secondary" align="center" accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      ) : null}
      <Button title="Sign in" onPress={submit} loading={loading} />
      {!isSupabaseConfigured ? <Button title="Continue in preview mode" variant="secondary" icon="eye-outline" onPress={() => useAuth.getState().enterGuest()} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        <Text variant="body" color="secondary">
          New to Life OS?
        </Text>
        <Text variant="bodyMedium" color="accent" onPress={() => router.replace('/(auth)/register')} accessibilityRole="link">
          Create account
        </Text>
      </View>
    </AuthShell>
  );
}
