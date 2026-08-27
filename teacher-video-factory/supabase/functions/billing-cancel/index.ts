import { HttpError, json, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments/registry.ts';

/** ยกเลิกการต่ออายุ — ผู้ใช้ยังใช้งานได้จนจบรอบบิลปัจจุบัน */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const service = serviceClient();

    const { data: subscription } = await service
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.provider_subscription_id) {
      throw new HttpError('NOT_FOUND', 'ยังไม่มีการสมัครสมาชิกที่ต้องยกเลิก');
    }

    await getPaymentProvider().cancelSubscription({
      subscriptionRef: subscription.provider_subscription_id,
    });

    const { data: updated } = await service
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id)
      .select('*')
      .single();

    return json({ subscription: updated });
  }),
);
