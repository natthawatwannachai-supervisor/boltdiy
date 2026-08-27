import { supabase } from '@/lib/supabase';
import { invokeFunction, unwrap } from './client';
import type { AssistantMessageRow, AssistantThreadRow } from '@/types/database';

/** ประเภทสื่อที่ "น้อง Teacher AI" สร้างให้ได้นอกเหนือจากการตอบคำถาม */
export type AssistantArtifactKind =
  | 'quiz'
  | 'worksheet'
  | 'exit_ticket'
  | 'activity'
  | 'handout'
  | 'chapter_questions';

export const ASSISTANT_QUICK_PROMPTS: { label: string; prompt: string }[] = [
  { label: 'สร้างวิดีโอให้หน่อย', prompt: 'ช่วยทำวิดีโอเรื่องเศษส่วนสำหรับ ป.4' },
  { label: 'ปรับบทให้สนุกขึ้น', prompt: 'ช่วยปรับ Script ให้สนุกขึ้น' },
  { label: 'เพิ่มกิจกรรมท้ายคลิป', prompt: 'เพิ่มกิจกรรมท้ายคลิป' },
  { label: 'ตั้งคำถามท้ายบท', prompt: 'สร้างคำถามหลังดูวิดีโอ 5 ข้อ' },
  { label: 'ทำใบงาน', prompt: 'สร้างใบงานจากเนื้อหาในวิดีโอนี้' },
  { label: 'ทำ Exit Ticket', prompt: 'สร้าง Exit Ticket 3 ข้อ' },
];

export const listThreads = async () =>
  unwrap(
    await supabase.from('assistant_threads').select('*').order('updated_at', { ascending: false }),
  ) as AssistantThreadRow[];

export const listMessages = async (threadId: string) =>
  unwrap(
    await supabase
      .from('assistant_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true }),
  ) as AssistantMessageRow[];

export interface AssistantReply {
  thread_id: string;
  message: AssistantMessageRow;
  /** ถ้า AI เข้าใจว่าครูอยากสร้างวิดีโอ จะส่ง action นี้กลับมาให้แอปเปิด wizard ต่อ */
  action?: { type: 'create_video'; prompt: string } | { type: 'open_video'; video_id: string };
}

export const sendAssistantMessage = (input: {
  thread_id?: string | null;
  video_id?: string | null;
  message: string;
}) => invokeFunction<AssistantReply>('ai-assistant', input);
