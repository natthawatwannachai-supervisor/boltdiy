import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

initializeApp();

const REGION = 'asia-southeast1';

/**
 * Changing another account's credentials requires the Admin SDK, which cannot
 * run in the browser. These callables are the only path the web app has to
 * those operations, and each one re-checks that the caller is an administrator
 * — never trust a client-side role flag.
 */
async function assertAdmin(request: CallableRequest<unknown>): Promise<void> {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'ต้องเข้าสู่ระบบก่อนใช้งาน');
  }

  const admin = await getFirestore().collection('admins').doc(uid).get();

  if (!admin.exists) {
    throw new HttpsError('permission-denied', 'เฉพาะผู้ดูแลระบบเท่านั้น');
  }
}

function requireUid(uid: unknown): string {
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new HttpsError('invalid-argument', 'ไม่พบรหัสผู้ใช้ (uid)');
  }

  return uid;
}

export const adminSetUserPassword = onCall(
  { region: REGION },
  async (request: CallableRequest<{ uid: string; password: string }>) => {
    await assertAdmin(request);

    const uid = requireUid(request.data?.uid);
    const { password } = request.data ?? {};

    if (typeof password !== 'string' || password.length < 6) {
      throw new HttpsError('invalid-argument', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    await getAuth().updateUser(uid, { password });

    return { ok: true };
  },
);

export const adminSetUserEmail = onCall(
  { region: REGION },
  async (request: CallableRequest<{ uid: string; email: string }>) => {
    await assertAdmin(request);

    const uid = requireUid(request.data?.uid);
    const email = request.data?.email;

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new HttpsError('invalid-argument', 'รูปแบบอีเมลไม่ถูกต้อง');
    }

    await getAuth().updateUser(uid, { email });
    await getFirestore().collection('users').doc(uid).update({ email });

    return { ok: true };
  },
);

export const adminSetUserDisabled = onCall(
  { region: REGION },
  async (request: CallableRequest<{ uid: string; disabled: boolean }>) => {
    await assertAdmin(request);

    const uid = requireUid(request.data?.uid);
    const disabled = Boolean(request.data?.disabled);

    await getAuth().updateUser(uid, { disabled });
    await getFirestore().collection('users').doc(uid).update({ disabled });

    return { ok: true };
  },
);
