import { CORS_HEADERS, errorResponse, json } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments/registry.ts';
import { notifyUser } from '../_shared/notify.ts';

/**
 * รับผลการชำระเงินจากผู้ให้บริการ แล้วเปิดสิทธิ์ให้ผู้ใช้
 * ต้อง deploy ด้วย --no-verify-jwt เพราะผู้เรียกคือ payment provider ไม่ใช่ผู้ใช้
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const provider = getPaymentProvider();
    const rawBody = await req.text();
    const event = await provider.parseWebhook(rawBody, req.headers.get('stripe-signature'));

    if (event.type === 'ignored') {
      return json({ received: true });
    }

    const service = serviceClient();

    if (event.type === 'subscription_cancelled') {
      await service
        .from('subscriptions')
        .update({ status: 'cancelled', plan: 'free', cancelled_at: new Date().toISOString() })
        .eq('provider_subscription_id', event.subscriptionRef);

      return json({ received: true });
    }

    const { data: payment } = await service
      .from('payments')
      .select('*')
      .eq('provider_reference', event.reference)
      .maybeSingle();

    if (!payment || payment.status === 'paid') {
      return json({ received: true });
    }

    await service
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id);

    if (payment.kind === 'credits') {
      const { data: wallet } = await service
        .from('credit_wallets')
        .select('balance')
        .eq('user_id', payment.user_id)
        .single();

      const balance = (wallet?.balance ?? 0) + (payment.credits ?? 0);

      await service
        .from('credit_wallets')
        .update({ balance, updated_at: new Date().toISOString() })
        .eq('user_id', payment.user_id);

      await service.from('credit_transactions').insert({
        user_id: payment.user_id,
        amount: payment.credits ?? 0,
        balance_after: balance,
        reason: `ซื้อเครดิต ${payment.credits} เครดิต`,
      });

      await notifyUser(service, {
        userId: payment.user_id,
        title: `✨ เพิ่ม ${payment.credits} เครดิตเรียบร้อย`,
        body: 'พร้อมใช้สร้างสื่อการสอนต่อได้ทันที',
        kind: 'credits',
      });

      return json({ received: true });
    }

    // ---- อัปเกรดแพ็กเกจรายเดือน ----
    const { data: plan } = await service
      .from('plans')
      .select('*')
      .eq('key', payment.plan)
      .single();

    const { data: current } = await service
      .from('subscriptions')
      .select('first_paid_at')
      .eq('user_id', payment.user_id)
      .single();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    await service
      .from('subscriptions')
      .update({
        plan: payment.plan,
        status: 'active',
        videos_used_this_period: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        provider: provider.name,
        provider_subscription_id: event.subscriptionRef,
        first_paid_at: current?.first_paid_at ?? now.toISOString(),
      })
      .eq('user_id', payment.user_id);

    const { data: wallet } = await service
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', payment.user_id)
      .single();

    const balance = (wallet?.balance ?? 0) + (plan?.monthly_credits ?? 0);

    await service
      .from('credit_wallets')
      .update({ balance, monthly_grant: plan?.monthly_credits ?? 0, updated_at: now.toISOString() })
      .eq('user_id', payment.user_id);

    await service.from('credit_transactions').insert({
      user_id: payment.user_id,
      amount: plan?.monthly_credits ?? 0,
      balance_after: balance,
      reason: `เครดิตรายเดือนจากแพ็กเกจ ${plan?.name}`,
    });

    // รางวัลผู้เชิญเมื่อเพื่อนอัปเกรดเป็นแพ็กเกจแบบชำระเงินครั้งแรก (สเปกข้อ 27)
    if (!current?.first_paid_at) {
      const { data: referral } = await service
        .from('referrals')
        .select('id, referrer_id, upgrade_rewarded')
        .eq('referred_id', payment.user_id)
        .maybeSingle();

      if (referral && !referral.upgrade_rewarded) {
        await service.rpc('refund_credits', {
          p_user_id: referral.referrer_id,
          p_amount: 100,
          p_reason: 'เพื่อนที่คุณเชิญอัปเกรดเป็น Premium',
          p_video_id: null,
        });

        await service.from('referrals').update({ upgrade_rewarded: true }).eq('id', referral.id);

        await notifyUser(service, {
          userId: referral.referrer_id,
          title: '✨ คุณได้รับ 100 Credits',
          body: 'เพื่อนที่คุณเชิญอัปเกรดเป็นแพ็กเกจ Premium แล้ว',
          kind: 'credits',
        });
      }
    }

    await notifyUser(service, {
      userId: payment.user_id,
      title: `🎉 อัปเกรดเป็นแพ็กเกจ ${plan?.name} แล้ว`,
      body: 'ปลดล็อกวิดีโอความละเอียดสูง ไม่มีลายน้ำ และเครดิตเพิ่มทุกเดือน',
      kind: 'system',
    });

    return json({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
});
