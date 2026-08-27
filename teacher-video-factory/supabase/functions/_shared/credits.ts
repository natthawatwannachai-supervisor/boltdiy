import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http.ts';
import { rethrowPostgresError } from './supabase.ts';

/**
 * หักเครดิตผ่าน RPC ที่ล็อกแถวกระเป๋าเงิน — เรียกก่อนเริ่มงาน AI เสมอ
 * ใช้ client ที่สวมสิทธิ์ผู้ใช้ เพื่อให้ auth.uid() ภายในฟังก์ชันเป็นคนที่เรียกจริง
 */
export const spendCredits = async (
  client: SupabaseClient,
  action: string,
  quantity = 1,
  videoId: string | null = null,
): Promise<{ balance: number; spent: number }> => {
  const { data, error } = await client.rpc('spend_credits', {
    p_action: action,
    p_video_id: videoId,
    p_quantity: quantity,
  });

  if (error) {
    rethrowPostgresError(error);
  }

  const row = (data as { balance: number; spent: number }[] | null)?.[0];

  if (!row) {
    throw new HttpError('UNKNOWN', 'หักเครดิตไม่สำเร็จ');
  }

  return row;
};

/**
 * หักเครดิตแทนผู้ใช้จาก worker เบื้องหลังซึ่งไม่มี auth.uid()
 * ผู้เรียกต้องตรวจสิทธิ์ความเป็นเจ้าของวิดีโอมาก่อนแล้ว
 */
export const spendCreditsFor = async (
  service: SupabaseClient,
  userId: string,
  action: string,
  quantity = 1,
  videoId: string | null = null,
): Promise<{ balance: number; spent: number }> => {
  const { data, error } = await service.rpc('spend_credits_for', {
    p_user_id: userId,
    p_action: action,
    p_video_id: videoId,
    p_quantity: quantity,
  });

  if (error) {
    rethrowPostgresError(error);
  }

  const row = (data as { balance: number; spent: number }[] | null)?.[0];

  if (!row) {
    throw new HttpError('UNKNOWN', 'หักเครดิตไม่สำเร็จ');
  }

  return row;
};

/** คืนเครดิตเมื่องานล้มเหลวถาวร ใช้ service role เพราะผู้ใช้เพิ่มเครดิตเองไม่ได้ */
export const refundCredits = async (
  service: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  videoId: string | null = null,
) => {
  const { error } = await service.rpc('refund_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_video_id: videoId,
  });

  if (error) {
    console.error('[credits] คืนเครดิตไม่สำเร็จ', error.message);
  }
};

/** บันทึกต้นทุนจริงที่จ่ายให้ provider เพื่อคำนวณกำไรต่อวิดีโอในหน้า Admin */
export const logAiUsage = async (
  service: SupabaseClient,
  input: {
    userId: string | null;
    videoId: string | null;
    action: string;
    provider: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    costThb?: number;
    latencyMs?: number;
    success?: boolean;
  },
) => {
  const { error } = await service.from('ai_usage_logs').insert({
    user_id: input.userId,
    video_id: input.videoId,
    action: input.action,
    provider: input.provider,
    model: input.model ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    cost_thb: input.costThb ?? 0,
    latency_ms: input.latencyMs ?? null,
    success: input.success ?? true,
  });

  if (error) {
    console.error('[usage] บันทึกต้นทุน AI ไม่สำเร็จ', error.message);
  }
};
