import { supabase } from '@/lib/supabase';
import { AppError, toAppError, type AppErrorCode } from '@/lib/errors';

interface EdgeErrorBody {
  error?: { code?: string; message?: string; details?: Record<string, number> };
}

/**
 * เรียก Supabase Edge Function พร้อมแปลง error ให้เป็น AppError ภาษาไทย
 * API key ของ AI อยู่ฝั่ง Edge Function เท่านั้น แอปมือถือไม่เคยเห็น
 */
export const invokeFunction = async <TResponse, TBody extends object = Record<string, unknown>>(
  name: string,
  body?: TBody,
): Promise<TResponse> => {
  const { data, error } = await supabase.functions.invoke<TResponse>(name, {
    body: body ?? {},
  });

  if (!error) {
    return data as TResponse;
  }

  // supabase-js ห่อ error ของ HTTP ไว้ อ่าน body เพื่อดึงรหัสจริงออกมา
  const context = (error as { context?: Response }).context;

  if (context && typeof context.json === 'function') {
    try {
      const parsed = (await context.json()) as EdgeErrorBody;

      if (parsed.error?.code) {
        throw toAppError({
          code: parsed.error.code as AppErrorCode,
          message: parsed.error.message,
          details: parsed.error.details,
          status: context.status,
        });
      }
    } catch (parseError) {
      if (parseError instanceof AppError) {
        throw parseError;
      }
    }
  }

  throw toAppError(error);
};

/** ใช้กับทุก query ของ postgrest เพื่อให้ error ถูกแปลงเป็นภาษาไทยเสมอ */
export const unwrap = <T>(result: { data: T | null; error: unknown }): T => {
  if (result.error) {
    throw toAppError(result.error);
  }

  return result.data as T;
};
