import { HttpError } from '../http.ts';
import { stripePayments } from './stripe.ts';
import type { PaymentProvider } from './types.ts';

/**
 * เลือกผู้ให้บริการชำระเงินจาก env
 * ตลาดไทยนิยม Omise (รองรับ PromptPay) — เพิ่ม adapter ใหม่ในโฟลเดอร์นี้ได้โดยไม่แตะโค้ดฟีเจอร์
 */
export const getPaymentProvider = (): PaymentProvider => {
  const name = Deno.env.get('PAYMENT_PROVIDER') ?? 'stripe';

  switch (name) {
    case 'stripe':
      return stripePayments();
    default:
      throw new HttpError(
        'UNKNOWN',
        `ยังไม่มี adapter สำหรับผู้ให้บริการชำระเงิน "${name}" — เพิ่มไฟล์ใน _shared/payments แล้วลงทะเบียนที่นี่`,
      );
  }
};
