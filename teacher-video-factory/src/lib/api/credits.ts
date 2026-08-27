import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { CreditTransactionRow } from '@/types/database';
import type { CreditWallet } from '@/types/domain';

export const getWallet = async () =>
  unwrap(await supabase.from('credit_wallets').select('*').single()) as CreditWallet;

export const listCreditTransactions = async (limit = 50) =>
  unwrap(
    await supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
  ) as CreditTransactionRow[];

export const subscribeToWallet = (userId: string, onChange: (wallet: CreditWallet) => void) => {
  const channel = supabase
    .channel(`wallet:${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'credit_wallets', filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload.new as CreditWallet),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
