import type { AuthError } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/config';
import { resetAllEntities } from '@/store/entities';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useSubscription } from '@/store/subscription';
import { useSync } from '@/store/sync';
import { registerPushToken } from './notifications';
import { identifyPurchaser, logOutPurchaser } from './purchases';
import { runSync } from './sync';
import { supabase } from './supabase';

const friendly = (e: AuthError | Error | null): string => {
  const msg = e?.message ?? 'Something went wrong';
  if (/invalid login/i.test(msg)) return 'Incorrect email or password.';
  if (/already registered/i.test(msg)) return 'An account with this email already exists.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox.';
  if (/rate limit/i.test(msg)) return 'Too many attempts. Try again in a few minutes.';
  if (/network|fetch/i.test(msg)) return 'No connection. Check your internet and try again.';
  return msg;
};

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

let lastUserId: string | null = null;

/** Restores the session and keeps the app in sync with auth changes. Returns cleanup. */
export function initAuth(): () => void {
  if (!supabase) {
    useAuth.getState().setSession(null);
    return () => undefined;
  }
  void supabase.auth.getSession().then(({ data }) => useAuth.getState().setSession(data.session));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.getState().setSession(session);
    const uid = session?.user.id ?? null;
    if (uid && uid !== lastUserId) {
      // A different account than the one whose data is on this device: start clean.
      if (lastUserId) wipeLocal();
      lastUserId = uid;
      void identifyPurchaser(uid);
      void runSync();
      void registerPushToken();
    }
    if (!uid && lastUserId) {
      lastUserId = null;
    }
  });
  return () => data.subscription.unsubscribe();
}

function wipeLocal() {
  resetAllEntities();
  useProfile.getState().reset();
  useSubscription.getState().reset();
  useSync.getState().reset();
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Backend is not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: friendly(error) } : { ok: true };
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Backend is not configured.' };
  const profile = useProfile.getState();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: name.trim() || profile.displayName } },
  });
  if (error) return { ok: false, error: friendly(error) };
  if (name.trim()) profile.setProfile({ displayName: name.trim() });
  return { ok: true, needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Backend is not configured.' };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return error ? { ok: false, error: friendly(error) } : { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    await logOutPurchaser();
  } else {
    useAuth.getState().leaveGuest();
  }
  wipeLocal();
  lastUserId = null;
}

export async function deleteAccountData(): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Backend is not configured.' };
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return { ok: false, error: friendly(error as unknown as Error) };
  await signOut();
  return { ok: true };
}

export const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
