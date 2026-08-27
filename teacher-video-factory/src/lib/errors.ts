import { th } from '@/i18n/th';

/** รหัสข้อผิดพลาดที่ Edge Function ส่งกลับมา ใช้ตัดสินใจว่าจะแสดง UI แบบไหน */
export type AppErrorCode =
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
  | 'NETWORK'
  | 'UNKNOWN';

export interface AppErrorDetails {
  required?: number;
  balance?: number;
  limit?: number;
  retryAfterSec?: number;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details: AppErrorDetails;
  /** true = กดปุ่ม "ลองใหม่" แล้วมีโอกาสสำเร็จ */
  readonly retryable: boolean;

  constructor(code: AppErrorCode, message: string, details: AppErrorDetails = {}, retryable = false) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

const RETRYABLE: AppErrorCode[] = [
  'AI_PROVIDER_ERROR',
  'IMAGE_GENERATION_FAILED',
  'VOICE_GENERATION_FAILED',
  'RENDER_FAILED',
  'NETWORK',
  'UNKNOWN',
];

const MESSAGE_BY_CODE: Partial<Record<AppErrorCode, string>> = {
  IMAGE_GENERATION_FAILED: th.error.image,
  VOICE_GENERATION_FAILED: th.error.voice,
  RENDER_FAILED: th.error.render,
  NETWORK: th.error.network,
  UNAUTHORIZED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
  NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  RATE_LIMITED: 'มีคำขอเข้ามาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
  PLAN_LIMIT_VIDEOS: th.error.quotaVideos,
  PLAN_FEATURE_LOCKED: 'ฟีเจอร์นี้ใช้ได้ในแพ็กเกจที่สูงขึ้น',
};

/** แปลง error ทุกชนิด (Supabase / fetch / ไม่รู้จัก) ให้เป็น AppError ที่มีข้อความภาษาไทย */
export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && /network|fetch/i.test(error.message)) {
    return new AppError('NETWORK', th.error.network, {}, true);
  }

  if (typeof error === 'object' && error !== null) {
    const raw = error as { code?: string; message?: string; details?: AppErrorDetails; status?: number };
    const code = (raw.code ?? '').toUpperCase() as AppErrorCode;

    if (code && MESSAGE_BY_CODE[code] !== undefined) {
      return new AppError(code, MESSAGE_BY_CODE[code]!, raw.details ?? {}, RETRYABLE.includes(code));
    }

    if (code === 'INSUFFICIENT_CREDITS') {
      const required = raw.details?.required ?? 0;
      const balance = raw.details?.balance ?? 0;

      return new AppError('INSUFFICIENT_CREDITS', th.credits.insufficientBody(required, balance), raw.details ?? {});
    }

    if (raw.status === 401 || raw.status === 403) {
      return new AppError('UNAUTHORIZED', MESSAGE_BY_CODE.UNAUTHORIZED!, {});
    }

    if (raw.message) {
      return new AppError('UNKNOWN', raw.message, {}, true);
    }
  }

  return new AppError('UNKNOWN', th.error.generic, {}, true);
};

/** ข้อความสั้นสำหรับ toast */
export const errorMessage = (error: unknown) => toAppError(error).message;
