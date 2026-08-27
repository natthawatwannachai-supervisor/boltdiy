import { supabase } from '@/lib/supabase';
import { unwrap } from './client';

export interface AdminOverview {
  total_users: number;
  active_users_30d: number;
  free_users: number;
  paid_users: number;
  mrr_thb: number;
  videos_total: number;
  videos_30d: number;
  credits_spent_30d: number;
  ai_cost_thb_30d: number;
  conversion_rate: number;
  churn_rate: number;
}

export interface AdminDailyStat {
  day: string;
  signups: number;
  videos_created: number;
  revenue_thb: number;
  credits_spent: number;
}

export const getAdminOverview = async () =>
  unwrap(await supabase.from('admin_overview').select('*').single()) as AdminOverview;

export const getAdminDailyStats = async (days = 30) =>
  unwrap(
    await supabase.from('admin_daily_stats').select('*').order('day', { ascending: true }).limit(days),
  ) as AdminDailyStat[];

export interface UsageInsight {
  label: string;
  value: number;
}

/** สถิติการใช้งานสำหรับหน้า Analytics (Template ยอดนิยม / ฟีเจอร์ที่ใช้มากสุด) */
export const getUsageInsights = async () => {
  const { data, error } = await supabase.rpc('usage_insights' as never);

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as { group: string; label: string; value: number }[];
};
