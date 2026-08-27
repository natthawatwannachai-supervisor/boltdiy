import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { HttpError } from './http.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/** ไคลเอนต์สิทธิ์เต็ม ใช้เขียนข้อมูลที่ผู้ใช้ไม่ควรเขียนเองได้ (เครดิต, สถานะงาน) */
export const serviceClient = (): SupabaseClient =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/** ไคลเอนต์ที่สวมสิทธิ์ผู้ใช้ — RLS ยังทำงานอยู่ ใช้เมื่อต้องเคารพสิทธิ์เจ้าของข้อมูล */
export const userClient = (req: Request): SupabaseClient => {
  const authorization = req.headers.get('Authorization') ?? '';

  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const requireUser = async (req: Request): Promise<{ user: User; client: SupabaseClient }> => {
  const client = userClient(req);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new HttpError('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
  }

  return { user: data.user, client };
};

/** แปลง error ของ Postgres ให้เป็น HttpError ที่แอปเข้าใจ */
export const rethrowPostgresError = (error: { message?: string; details?: string } | null): never => {
  const message = error?.message ?? '';

  if (message.includes('INSUFFICIENT_CREDITS')) {
    let details: Record<string, unknown> = {};

    try {
      details = JSON.parse(error?.details ?? '{}');
    } catch {
      details = {};
    }

    throw new HttpError('INSUFFICIENT_CREDITS', 'เครดิตของคุณไม่เพียงพอ', details);
  }

  if (message.includes('UNAUTHORIZED')) {
    throw new HttpError('UNAUTHORIZED', 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
  }

  if (message.includes('NOT_FOUND')) {
    throw new HttpError('NOT_FOUND', error?.details ?? 'ไม่พบข้อมูลที่ต้องการ');
  }

  if (message.includes('VALIDATION_ERROR')) {
    throw new HttpError('VALIDATION_ERROR', error?.details ?? 'ข้อมูลไม่ถูกต้อง');
  }

  throw new HttpError('UNKNOWN', message || 'เกิดข้อผิดพลาดกับฐานข้อมูล');
};
