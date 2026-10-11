import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  /** Preview mode: no Supabase project configured, data stays on this device. */
  guest: boolean;
  userId: string | null;
  email: string | null;
  setSession: (session: Session | null) => void;
  enterGuest: () => void;
  leaveGuest: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  guest: false,
  userId: null,
  email: null,
  setSession: (session) =>
    set((s) => ({
      session,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      status: session ? 'signedIn' : s.guest ? 'signedIn' : 'signedOut',
    })),
  enterGuest: () => set({ guest: true, status: 'signedIn', userId: null }),
  leaveGuest: () => set({ guest: false, status: 'signedOut' }),
}));
