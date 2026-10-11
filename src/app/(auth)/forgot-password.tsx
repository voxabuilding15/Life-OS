import { router } from 'expo-router';
import { useState } from 'react';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { sendPasswordReset, validateEmail } from '@/services/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    setError(null);
    setLoading(true);
    const res = await sendPasswordReset(email);
    setLoading(false);
    if (res.ok) setSent(true);
    else setError(res.error);
  };

  return (
    <AuthShell title="Reset password" subtitle="Enter your email and we'll send you a link to set a new password." back>
      {sent ? (
        <Text variant="body" color="accent" accessibilityLiveRegion="polite">
          If an account exists for {email.trim()}, a reset link is on its way.
        </Text>
      ) : (
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={error} onSubmitEditing={submit} />
      )}
      {sent ? <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} /> : <Button title="Send reset link" onPress={submit} loading={loading} />}
    </AuthShell>
  );
}
