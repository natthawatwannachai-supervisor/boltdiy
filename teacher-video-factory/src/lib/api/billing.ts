import { supabase } from '@/lib/supabase';
import { invokeFunction, unwrap } from './client';
import type { SubscriptionRow } from '@/types/database';
import type { PlanKey } from '@/types/domain';

export const getSubscription = async () =>
  unwrap(await supabase.from('subscriptions').select('*').single()) as SubscriptionRow;

/**
 * สร้างลิงก์ชำระเงิน — ฝั่ง Edge Function เป็นผู้คุยกับผู้ให้บริการชำระเงิน
 * (Stripe หรือ Omise สำหรับ PromptPay/บัตรในไทย) แอปไม่เก็บข้อมูลบัตรเลย
 */
export const createSubscriptionCheckout = (plan: PlanKey) =>
  invokeFunction<{ checkout_url: string }>('billing-checkout', { kind: 'subscription', plan });

export const createCreditCheckout = (packId: string) =>
  invokeFunction<{ checkout_url: string }>('billing-checkout', { kind: 'credits', pack_id: packId });

export const openBillingPortal = () =>
  invokeFunction<{ portal_url: string }>('billing-portal', {});

export const cancelSubscription = () =>
  invokeFunction<{ subscription: SubscriptionRow }>('billing-cancel', {});
