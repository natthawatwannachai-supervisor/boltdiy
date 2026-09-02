import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, persistenceFor } from '@/config/firebase';
import { ADMIN_EMAIL, ADMIN_USERNAME } from '@/config/constants';
import type { RegisterPayload } from '@/types';
import { compressSignature, dataUrlToFile } from '@/utils/imageCompression';
import { createUserProfile, isAdminUid } from './userService';
import { uploadSignature } from './storageService';

/**
 * The administrator signs in with a username rather than an email; everything
 * else in the app is email based. Mapping it here keeps a single Firebase Auth
 * code path (and a single password store) for both kinds of account.
 */
export function resolveLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim();

  return trimmed.toLowerCase() === ADMIN_USERNAME.toLowerCase() ? ADMIN_EMAIL : trimmed;
}

export interface LoginResult {
  user: User;
  isAdmin: boolean;
}

export async function login(
  identifier: string,
  password: string,
  rememberMe: boolean,
): Promise<LoginResult> {
  // Persistence must be set before signIn so the very first session honours it.
  await setPersistence(auth, persistenceFor(rememberMe));

  const email = resolveLoginIdentifier(identifier);
  const credential = await signInWithEmailAndPassword(auth, email, password);

  return { user: credential.user, isAdmin: await isAdminUid(credential.user.uid) };
}

export async function register(payload: RegisterPayload): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    payload.email.trim(),
    payload.password,
  );
  const { user } = credential;

  let signatureUrl: string | null = null;
  let signaturePath: string | null = null;

  if (payload.signature) {
    const raw =
      typeof payload.signature === 'string'
        ? dataUrlToFile(payload.signature, 'signature.png')
        : payload.signature;
    const uploaded = await uploadSignature(user.uid, await compressSignature(raw));

    signatureUrl = uploaded.url;
    signaturePath = uploaded.path;
  }

  await updateProfile(user, {
    displayName: payload.fullName.trim(),
    photoURL: signatureUrl ?? undefined,
  });

  await createUserProfile(user.uid, {
    fullName: payload.fullName.trim(),
    position: payload.position.trim(),
    academicStanding: payload.academicStanding,
    department: payload.department,
    email: payload.email.trim(),
    phone: payload.phone.replace(/[\s-]/g, ''),
    lineId: payload.lineId.trim(),
    signatureUrl,
    signaturePath,
    role: 'supervisor',
  });

  // Registration ends at the login modal, so the new account starts signed out.
  await signOut(auth);

  return user;
}

export const logout = () => signOut(auth);

export const requestPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email.trim());

/** Maps Firebase auth error codes onto Thai copy the user can act on. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    case 'auth/user-disabled':
      return 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง';
    case 'auth/email-already-in-use':
      return 'อีเมลนี้ถูกใช้ลงทะเบียนแล้ว';
    case 'auth/weak-password':
      return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    case 'auth/too-many-requests':
      return 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
    case 'auth/network-request-failed':
      return 'เชื่อมต่อเครือข่ายไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต';
    case 'permission-denied':
      return 'ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้';
    default:
      return (error as Error)?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  }
}
