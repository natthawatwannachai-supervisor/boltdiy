import type { SupabaseClient } from '@supabase/supabase-js';
import { GRADE_LABEL, SUBJECT_LABEL } from './prompts.ts';

/** สรุปบริบทวิดีโอเป็นข้อความสั้น ๆ ให้ผู้ช่วย AI เข้าใจว่าครูกำลังทำอะไรอยู่ */
export const toLessonContextSafe = async (
  service: SupabaseClient,
  videoId: string | null,
): Promise<string | null> => {
  if (!videoId) {
    return null;
  }

  const { data } = await service
    .from('videos')
    .select('title, topic, grade_level, subject, duration_min, objectives')
    .eq('id', videoId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const video = data as {
    title: string;
    topic: string;
    grade_level: string;
    subject: string;
    duration_min: number;
    objectives: { text: string }[];
  };

  return [
    `ชื่อวิดีโอ: ${video.title}`,
    `หัวข้อ: ${video.topic}`,
    `ระดับชั้น: ${GRADE_LABEL[video.grade_level] ?? video.grade_level}`,
    `วิชา: ${SUBJECT_LABEL[video.subject] ?? video.subject}`,
    `ความยาว: ${video.duration_min} นาที`,
    video.objectives?.length
      ? `วัตถุประสงค์: ${video.objectives.map((o) => o.text).join(' / ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};

/** ดึงเฉพาะบทบรรยายของแต่ละฉาก ใช้เป็นบริบทให้ผู้ช่วย AI */
export const loadScenes = async (service: SupabaseClient, videoId: string): Promise<string[]> => {
  const { data } = await service
    .from('scenes')
    .select('narration')
    .eq('video_id', videoId)
    .order('index', { ascending: true });

  return ((data ?? []) as { narration: string }[]).map((scene) => scene.narration);
};
