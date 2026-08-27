import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { ReferralRow } from '@/types/database';

export const listReferrals = async () =>
  unwrap(
    await supabase.from('referrals').select('*').order('created_at', { ascending: false }),
  ) as ReferralRow[];

export const redeemReferralCode = async (code: string) => {
  const { data, error } = await supabase.rpc('redeem_referral_code', {
    p_code: code.trim().toUpperCase(),
  });

  if (error) {
    throw error;
  }

  return (data as unknown as { rewarded: number }[])?.[0]?.rewarded ?? 0;
};
