import { HttpError } from '../http.ts';
import type { CheckoutInput, PaymentProvider } from './types.ts';

const API = 'https://api.stripe.com/v1';

const form = (params: Record<string, string | undefined>) => {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      body.set(key, value);
    }
  }

  return body;
};

const requireKey = () => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');

  if (!key) {
    throw new HttpError('UNKNOWN', 'ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY');
  }

  return key;
};

const call = async (path: string, body: URLSearchParams) => {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${requireKey()}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new HttpError('UNKNOWN', `Stripe ตอบกลับ ${response.status}: ${await response.text()}`);
  }

  return await response.json();
};

/** ตรวจลายเซ็นของ Stripe ด้วย HMAC-SHA256 ตามสูตรมาตรฐาน */
const verifySignature = async (rawBody: string, header: string | null, secret: string) => {
  if (!header) {
    return false;
  }

  const parts = Object.fromEntries(
    header.split(',').map((part) => part.split('=') as [string, string]),
  );

  if (!parts.t || !parts.v1) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${parts.t}.${rawBody}`),
  );

  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return expected === parts.v1;
};

export const stripePayments = (): PaymentProvider => ({
  name: 'stripe',

  async createCheckout(input: CheckoutInput) {
    const isSubscription = input.kind === 'subscription';

    const data = await call(
      '/checkout/sessions',
      form({
        mode: isSubscription ? 'subscription' : 'payment',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer_email: input.email ?? undefined,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'thb',
        // Stripe คิดเงินเป็นหน่วยย่อย (สตางค์)
        'line_items[0][price_data][unit_amount]': String(input.amountThb * 100),
        'line_items[0][price_data][product_data][name]': isSubscription
          ? `แพ็กเกจ ${input.planName ?? input.planKey}`
          : `${input.credits} เครดิต`,
        ...(isSubscription ? { 'line_items[0][price_data][recurring][interval]': 'month' } : {}),
        'metadata[user_id]': input.userId,
        'metadata[kind]': input.kind,
        'metadata[plan]': input.planKey ?? '',
        'metadata[pack_id]': input.packId ?? '',
        'metadata[credits]': String(input.credits ?? 0),
      }),
    );

    return { url: data.url as string, reference: data.id as string };
  },

  async createPortal(input) {
    const data = await call(
      '/billing_portal/sessions',
      form({ customer: input.customerRef, return_url: input.returnUrl }),
    );

    return { url: data.url as string };
  },

  async cancelSubscription(input) {
    await call(
      `/subscriptions/${input.subscriptionRef}`,
      form({ cancel_at_period_end: 'true' }),
    );
  },

  async parseWebhook(rawBody, signature) {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new HttpError('UNKNOWN', 'ยังไม่ได้ตั้งค่า STRIPE_WEBHOOK_SECRET');
    }

    if (!(await verifySignature(rawBody, signature, secret))) {
      throw new HttpError('UNAUTHORIZED', 'ลายเซ็น webhook ไม่ถูกต้อง');
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      return {
        type: 'checkout_paid',
        reference: event.data.object.id as string,
        customerRef: (event.data.object.customer as string | null) ?? null,
        subscriptionRef: (event.data.object.subscription as string | null) ?? null,
      };
    }

    if (event.type === 'customer.subscription.deleted') {
      return { type: 'subscription_cancelled', subscriptionRef: event.data.object.id as string };
    }

    return { type: 'ignored' };
  },
});
