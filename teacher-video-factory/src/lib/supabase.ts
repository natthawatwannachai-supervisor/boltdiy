import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'ไม่พบการตั้งค่า Supabase — กรุณากำหนด EXPO_PUBLIC_SUPABASE_URL และ EXPO_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env',
  );
}

/**
 * เก็บ session ไว้ใน SecureStore บนมือถือ (เข้ารหัสระดับ OS)
 * SecureStore จำกัดขนาดค่าไว้ที่ 2KB จึงแบ่งเก็บเป็นชิ้นเมื่อ token ยาวเกิน
 */
const CHUNK_SIZE = 1800;

const secureStorage = {
  getItem: async (key: string) => {
    const head = await SecureStore.getItemAsync(key);

    if (head === null) {
      return null;
    }

    if (!head.startsWith('__chunked__:')) {
      return head;
    }

    const count = Number(head.split(':')[1]);
    const parts: string[] = [];

    for (let i = 0; i < count; i += 1) {
      parts.push((await SecureStore.getItemAsync(`${key}.${i}`)) ?? '');
    }

    return parts.join('');
  },
  setItem: async (key: string, value: string) => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const count = Math.ceil(value.length / CHUNK_SIZE);

    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }

    await SecureStore.setItemAsync(key, `__chunked__:${count}`);
  },
  removeItem: async (key: string) => {
    const head = await SecureStore.getItemAsync(key);

    if (head?.startsWith('__chunked__:')) {
      const count = Number(head.split(':')[1]);

      for (let i = 0; i < count; i += 1) {
        await SecureStore.deleteItemAsync(`${key}.${i}`);
      }
    }

    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * ตอน server-side render (เช่นตอน build เว็บ) ยังไม่มี window
 * จึงใช้ storage ในหน่วยความจำแทน แล้วสลับกลับเมื่อรันในเบราว์เซอร์จริง
 */
const memoryStorage = (() => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
})();

const storage =
  Platform.OS === 'web'
    ? typeof window === 'undefined'
      ? memoryStorage
      : AsyncStorage
    : secureStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // มือถือไม่มี URL callback แบบเว็บ จึงปิดการอ่าน session จาก URL
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: { eventsPerSecond: 4 },
  },
});

export const SUPABASE_URL = supabaseUrl;
