import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';

interface SubscriptionState {
  isPro: boolean;
  expiresAt: string | null;
  productId: string | null;
  isTrial: boolean;
  willRenew: boolean;
  set: (patch: Partial<Pick<SubscriptionState, 'isPro' | 'expiresAt' | 'productId' | 'isTrial' | 'willRenew'>>) => void;
  reset: () => void;
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set) => ({
      isPro: false,
      expiresAt: null,
      productId: null,
      isTrial: false,
      willRenew: false,
      set: (patch) => set(patch),
      reset: () => set({ isPro: false, expiresAt: null, productId: null, isTrial: false, willRenew: false }),
    }),
    { name: 'lifeos.subscription', storage: persistStorage, version: 1 },
  ),
);

export const useIsPro = () => useSubscription((s) => s.isPro);
