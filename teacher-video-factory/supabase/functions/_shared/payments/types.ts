/** สัญญากลางของผู้ให้บริการชำระเงิน — เปลี่ยนจาก Stripe ไป Omise ได้โดยไม่แตะโค้ดฟีเจอร์ */

export interface CheckoutInput {
  userId: string;
  email: string | null;
  kind: 'subscription' | 'credits';
  /** สำหรับ subscription */
  planKey?: string;
  planName?: string;
  /** สำหรับซื้อเครดิต */
  packId?: string;
  credits?: number;
  amountThb: number;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<{ url: string; reference: string }>;
  createPortal(input: { customerRef: string; returnUrl: string }): Promise<{ url: string }>;
  cancelSubscription(input: { subscriptionRef: string }): Promise<void>;
  /** ตรวจลายเซ็น webhook แล้วคืนเหตุการณ์ที่ระบบสนใจ */
  parseWebhook(
    rawBody: string,
    signature: string | null,
  ): Promise<
    | { type: 'checkout_paid'; reference: string; customerRef: string | null; subscriptionRef: string | null }
    | { type: 'subscription_cancelled'; subscriptionRef: string }
    | { type: 'ignored' }
  >;
}
