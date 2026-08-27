/** ยูทิลิตี HTTP ที่ใช้ร่วมกันทุก Edge Function */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** รหัสข้อผิดพลาดต้องตรงกับ AppErrorCode ฝั่งแอปมือถือ */
export type ErrorCode =
  | 'INSUFFICIENT_CREDITS'
  | 'PLAN_LIMIT_VIDEOS'
  | 'PLAN_LIMIT_DURATION'
  | 'PLAN_FEATURE_LOCKED'
  | 'AI_PROVIDER_ERROR'
  | 'IMAGE_GENERATION_FAILED'
  | 'VOICE_GENERATION_FAILED'
  | 'RENDER_FAILED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'UNKNOWN';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INSUFFICIENT_CREDITS: 402,
  PLAN_LIMIT_VIDEOS: 402,
  PLAN_LIMIT_DURATION: 402,
  PLAN_FEATURE_LOCKED: 402,
  AI_PROVIDER_ERROR: 502,
  IMAGE_GENERATION_FAILED: 502,
  VOICE_GENERATION_FAILED: 502,
  RENDER_FAILED: 502,
  RATE_LIMITED: 429,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  UNKNOWN: 500,
};

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

export const errorResponse = (error: unknown) => {
  if (error instanceof HttpError) {
    return json(
      { error: { code: error.code, message: error.message, details: error.details } },
      STATUS_BY_CODE[error.code],
    );
  }

  // ข้อความจาก raise exception ของ Postgres ถูกแปลงเป็นรหัสที่แอปเข้าใจ
  const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
  console.error('[edge] unhandled error', error);

  return json({ error: { code: 'UNKNOWN', message } }, 500);
};

/** ครอบ handler ทุกตัวให้จัดการ CORS, method และ error แบบเดียวกัน */
export const serveJson = (
  handler: (req: Request) => Promise<Response>,
) =>
  async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return errorResponse(new HttpError('VALIDATION_ERROR', 'รองรับเฉพาะ HTTP POST'));
    }

    try {
      return await handler(req);
    } catch (error) {
      return errorResponse(error);
    }
  };

export const readBody = async <T>(req: Request): Promise<T> => {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError('VALIDATION_ERROR', 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง');
  }
};

export const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError('VALIDATION_ERROR', `ข้อมูล ${field} ไม่ถูกต้อง`);
  }

  return value.trim();
};

/** ลองใหม่แบบ exponential backoff สำหรับการเรียก provider ภายนอก */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 600 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // ข้อผิดพลาดจากการตรวจสอบข้อมูลไม่มีทางสำเร็จถ้าลองซ้ำ
      if (error instanceof HttpError && error.code === 'VALIDATION_ERROR') {
        throw error;
      }

      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
      }
    }
  }

  throw lastError;
};
