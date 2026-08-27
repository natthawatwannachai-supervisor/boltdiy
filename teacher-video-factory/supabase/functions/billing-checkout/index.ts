import { HttpError, json, readBody, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments/registry.ts';

interface Body {
  kind: 'subscription' | 'credits';
  plan?: string;
  pack_id?: string;
}

const APP_SCHEME = Deno.env.get('APP_RETURN_URL') ?? 'tvfactory://billing';

Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const service = serviceClient();
    const provider = getPaymentProvider();

    if (body.kind === 'subscription') {
      const { data: plan } = await service
        .from('plans')
        .select('key, name, price_thb, active')
        .eq('key', body.plan ?? '')
        .maybeSingle();

      if (!plan || !plan.active) {
        throw new HttpError('VALIDATION_ERROR', 'ไม่พบแพ็กเกจที่เลือก');
      }

      if (plan.price_thb === 0) {
        throw new HttpError('VALIDATION_ERROR', 'แพ็กเกจฟรีไม่ต้องชำระเงิน');
      }

      const checkout = await provider.createCheckout({
        userId: user.id,
        email: user.email ?? null,
        kind: 'subscription',
        planKey: plan.key,
        planName: plan.name,
        amountThb: plan.price_thb,
        successUrl: `${APP_SCHEME}?status=success`,
        cancelUrl: `${APP_SCHEME}?status=cancel`,
      });

      await service.from('payments').insert({
        user_id: user.id,
        kind: 'subscription',
        amount_thb: plan.price_thb,
        plan: plan.key,
        provider: provider.name,
        provider_reference: checkout.reference,
        status: 'pending',
      });

      return json({ checkout_url: checkout.url });
    }

    const { data: pack } = await service
      .from('credit_packs')
      .select('id, credits, price_thb, active')
      .eq('id', body.pack_id ?? '')
      .maybeSingle();

    if (!pack || !pack.active) {
      throw new HttpError('VALIDATION_ERROR', 'ไม่พบแพ็กเครดิตที่เลือก');
    }

    const checkout = await provider.createCheckout({
      userId: user.id,
      email: user.email ?? null,
      kind: 'credits',
      packId: pack.id,
      credits: pack.credits,
      amountThb: pack.price_thb,
      successUrl: `${APP_SCHEME}?status=success`,
      cancelUrl: `${APP_SCHEME}?status=cancel`,
    });

    await service.from('payments').insert({
      user_id: user.id,
      kind: 'credits',
      amount_thb: pack.price_thb,
      credits: pack.credits,
      provider: provider.name,
      provider_reference: checkout.reference,
      status: 'pending',
    });

    return json({ checkout_url: checkout.url });
  }),
);
