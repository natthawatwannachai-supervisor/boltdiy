import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/session';
import { fetchProfile } from '@/lib/api/auth';
import { getWallet, subscribeToWallet } from '@/lib/api/credits';
import { getSubscription } from '@/lib/api/billing';
import { queryClient } from '@/lib/queryClient';

/**
 * โหลด session + โปรไฟล์ + กระเป๋าเครดิต + แพ็กเกจ ตอนเปิดแอป
 * และคอยฟังการเปลี่ยนแปลงของ auth เพื่อให้ทุกหน้าจอเห็นข้อมูลตรงกัน
 */
export const useBootstrapSession = () => {
  const { setInitialized, setSession, setProfile, setWallet, setSubscription, reset } =
    useSessionStore.getState();

  useEffect(() => {
    let active = true;

    const loadUserData = async (userId: string) => {
      const [profile, wallet, subscription] = await Promise.allSettled([
        fetchProfile(userId),
        getWallet(),
        getSubscription(),
      ]);

      if (!active) {
        return;
      }

      if (profile.status === 'fulfilled') {
        setProfile(profile.value);
      }

      if (wallet.status === 'fulfilled') {
        setWallet(wallet.value);
      }

      if (subscription.status === 'fulfilled') {
        setSubscription(subscription.value);
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) {
          return;
        }

        setSession(data.session);

        if (data.session) {
          await loadUserData(data.session.user.id);
        }
      })
      .finally(() => {
        if (active) {
          setInitialized(true);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        reset();
        queryClient.clear();
        return;
      }

      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        void loadUserData(session.user.id);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [reset, setInitialized, setProfile, setSession, setSubscription, setWallet]);

  // เครดิตเปลี่ยนได้ตลอดเวลาจากงานเบื้องหลัง จึงฟังแบบเรียลไทม์
  const userId = useSessionStore((state) => state.session?.user.id ?? null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToWallet(userId, (wallet) => useSessionStore.getState().setWallet(wallet));
  }, [userId]);
};
