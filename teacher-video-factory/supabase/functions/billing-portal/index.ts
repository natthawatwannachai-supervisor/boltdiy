import { HttpError, json, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments/registry.ts';

const APP_SCHEME = Deno.env.get('APP_RETURN_URL') ?? 'tvfactory://billing';

Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const service = serviceClient();

    const { data: subscription } = await service
      .from('subscriptions')
      .select('provider_subscription_id, provider')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.provider_subscription_id) {
      throw new HttpError('NOT_FOUND', 'ยังไม่มีการสมัครสมาชิกแบบชำระเงิน');
    }

    const { data: payment } = await service
      .from('payments')
      .select('provider_reference')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const provider = getPaymentProvider();
    const portal = await provider.createPortal({
      customerRef: payment?.provider_reference ?? subscription.provider_subscription_id,
      returnUrl: APP_SCHEME,
    });

    return json({ portal_url: portal.url });
  }),
);
