import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';
import { updateUserProfile } from './userService';

const functions = getFunctions(app, 'asia-southeast1');

/**
 * Changing another account's password or email requires the Firebase Admin
 * SDK, which cannot run in the browser. Both operations are therefore proxied
 * through callable Cloud Functions (see `functions/src/index.ts`) that verify
 * the caller is listed in the `admins` collection before acting.
 */
const setPasswordFn = httpsCallable<{ uid: string; password: string }, { ok: boolean }>(
  functions,
  'adminSetUserPassword',
);

const setEmailFn = httpsCallable<{ uid: string; email: string }, { ok: boolean }>(
  functions,
  'adminSetUserEmail',
);

const setDisabledFn = httpsCallable<{ uid: string; disabled: boolean }, { ok: boolean }>(
  functions,
  'adminSetUserDisabled',
);

export async function adminSetUserPassword(uid: string, password: string): Promise<void> {
  await setPasswordFn({ uid, password });
}

export async function adminSetUserEmail(uid: string, email: string): Promise<void> {
  await setEmailFn({ uid, email });
  // Keep the Firestore mirror of the account in step with Firebase Auth.
  await updateUserProfile(uid, { email });
}

export async function adminSetUserDisabled(uid: string, disabled: boolean): Promise<void> {
  await setDisabledFn({ uid, disabled });
  await updateUserProfile(uid, { disabled });
}

/** Turns a callable-function failure into Thai copy for the admin UI. */
export function adminErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  if (code.includes('unauthenticated') || code.includes('permission-denied')) {
    return 'ไม่มีสิทธิ์ดำเนินการนี้ (เฉพาะผู้ดูแลระบบ)';
  }

  if (code.includes('not-found') || code.includes('internal')) {
    return 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบว่าได้ deploy Cloud Functions แล้ว';
  }

  return (error as Error)?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
