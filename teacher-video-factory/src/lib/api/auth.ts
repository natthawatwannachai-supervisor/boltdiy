import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { AppError, toAppError } from '@/lib/errors';
import { unwrap } from './client';
import type { Profile } from '@/types/domain';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri({ scheme: 'tvfactory', path: 'auth-callback' });

export const signUpWithEmail = async (email: string, password: string, referralCode?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: referralCode ? { referral_code: referralCode.trim().toUpperCase() } : undefined,
    },
  });

  if (error) {
    throw toAppError(error);
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new AppError('UNAUTHORIZED', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  return data;
};

export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

  if (error) {
    throw toAppError(error);
  }
};

/** ล็อกอินด้วยเบอร์โทรศัพท์ — ส่ง OTP ทาง SMS */
export const sendPhoneOtp = async (phone: string) => {
  const normalized = phone.replace(/[^0-9+]/g, '').replace(/^0/, '+66');
  const { error } = await supabase.auth.signInWithOtp({ phone: normalized });

  if (error) {
    throw toAppError(error);
  }

  return normalized;
};

export const verifyPhoneOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });

  if (error) {
    throw new AppError('UNAUTHORIZED', 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว');
  }

  return data;
};

/** เข้าสู่ระบบด้วย Google ผ่าน OAuth ของ Supabase (ใช้ PKCE + in-app browser) */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error || !data?.url) {
    throw toAppError(error ?? new Error('เปิดหน้าเข้าสู่ระบบ Google ไม่สำเร็จ'));
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new AppError('UNAUTHORIZED', 'ยกเลิกการเข้าสู่ระบบด้วย Google');
  }

  const code = new URL(result.url).searchParams.get('code');

  if (!code) {
    throw new AppError('UNAUTHORIZED', 'ไม่ได้รับรหัสยืนยันจาก Google');
  }

  const exchanged = await supabase.auth.exchangeCodeForSession(code);

  if (exchanged.error) {
    throw toAppError(exchanged.error);
  }

  return exchanged.data;
};

export const isAppleSignInAvailable = async () =>
  Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());

export const signInWithApple = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new AppError('UNAUTHORIZED', 'เข้าสู่ระบบด้วย Apple ไม่สำเร็จ');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    throw toAppError(error);
  }

  // Apple ส่งชื่อมาเฉพาะครั้งแรกที่ผู้ใช้อนุญาต จึงบันทึกทันที
  if (credential.fullName?.givenName && data.user) {
    await supabase
      .from('profiles')
      .update({
        first_name: credential.fullName.givenName,
        last_name: credential.fullName.familyName ?? null,
      })
      .eq('id', data.user.id);
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw toAppError(error);
  }
};

export const fetchProfile = async (userId: string): Promise<Profile> =>
  unwrap(await supabase.from('profiles').select('*').eq('id', userId).single());

export const updateProfile = async (userId: string, patch: Partial<Profile>): Promise<Profile> =>
  unwrap(await supabase.from('profiles').update(patch).eq('id', userId).select('*').single());

export const completeOnboarding = async (userId: string, patch: Partial<Profile>) =>
  updateProfile(userId, { ...patch, onboarded_at: new Date().toISOString() });
