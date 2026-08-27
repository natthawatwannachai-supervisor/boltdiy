import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { SubscriptionRow } from '@/types/database';
import type { CreditWallet, Profile } from '@/types/domain';

interface SessionState {
  /** null = ยังไม่รู้สถานะ (กำลังโหลด), undefined ไม่ถูกใช้ */
  initialized: boolean;
  session: Session | null;
  profile: Profile | null;
  wallet: CreditWallet | null;
  subscription: SubscriptionRow | null;
  setInitialized: (value: boolean) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setWallet: (wallet: CreditWallet | null) => void;
  setSubscription: (subscription: SubscriptionRow | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  initialized: false,
  session: null,
  profile: null,
  wallet: null,
  subscription: null,
  setInitialized: (initialized) => set({ initialized }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setWallet: (wallet) => set({ wallet }),
  setSubscription: (subscription) => set({ subscription }),
  reset: () => set({ session: null, profile: null, wallet: null, subscription: null }),
}));

export const useIsSignedIn = () => useSessionStore((state) => Boolean(state.session));
export const useCurrentUserId = () => useSessionStore((state) => state.session?.user.id ?? null);
export const useProfile = () => useSessionStore((state) => state.profile);
export const useWallet = () => useSessionStore((state) => state.wallet);
export const useSubscription = () => useSessionStore((state) => state.subscription);
export const useIsAdmin = () => useSessionStore((state) => state.profile?.role === 'admin');
