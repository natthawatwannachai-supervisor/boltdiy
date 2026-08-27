import { supabase } from '@/lib/supabase';
import { invokeFunction } from './client';

/** ผู้ใช้ดาวน์โหลดข้อมูลทั้งหมดของตนเองได้ตาม PDPA */
export const exportMyData = async () => {
  const { data, error } = await supabase.rpc('export_my_data');

  if (error) {
    throw error;
  }

  return data as Record<string, unknown>;
};

/** ลบบัญชีถาวร พร้อมไฟล์ใน Storage — ทำงานฝั่ง Edge Function ด้วยสิทธิ์ service role */
export const deleteMyAccount = () => invokeFunction<{ deleted: boolean }>('account-delete', {});
