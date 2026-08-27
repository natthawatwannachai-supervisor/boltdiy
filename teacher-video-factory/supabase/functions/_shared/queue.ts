import type { SupabaseClient } from '@supabase/supabase-js';

export type JobStage =
  | 'analyze' | 'objectives' | 'script' | 'storyboard'
  | 'images' | 'voice' | 'subtitles' | 'render' | 'quality' | 'thumbnail';

/** ลำดับงานของสายพานผลิตแบบอัตโนมัติเต็มรูปแบบ (สเปกข้อ 32) */
export const AUTO_PILOT_STAGES: JobStage[] = [
  'objectives',
  'script',
  'storyboard',
  'images',
  'voice',
  'subtitles',
  'render',
  'quality',
  'thumbnail',
];

/** สถานะวิดีโอที่ควรแสดงระหว่างแต่ละขั้น และ % ความคืบหน้าเมื่อขั้นนั้นเสร็จ */
export const STAGE_STATE: Record<JobStage, { status: string; progress: number }> = {
  analyze: { status: 'analyzing', progress: 5 },
  objectives: { status: 'analyzing', progress: 10 },
  script: { status: 'scripting', progress: 25 },
  storyboard: { status: 'storyboarding', progress: 35 },
  images: { status: 'generating_images', progress: 60 },
  voice: { status: 'generating_voice', progress: 75 },
  subtitles: { status: 'generating_subtitles', progress: 82 },
  render: { status: 'rendering', progress: 94 },
  quality: { status: 'quality_check', progress: 97 },
  thumbnail: { status: 'quality_check', progress: 99 },
};

export const enqueueStages = async (
  service: SupabaseClient,
  input: { videoId: string; ownerId: string; stages: JobStage[]; payload?: Record<string, unknown> },
) => {
  // ตำแหน่งเริ่มต้นของลำดับ ต่อจากงานที่ค้างอยู่ของวิดีโอนี้ (ถ้ามี)
  const { data: lastJob } = await service
    .from('jobs')
    .select('sequence')
    .eq('video_id', input.videoId)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();

  const offset = ((lastJob as { sequence: number } | null)?.sequence ?? -1) + 1;

  const rows = input.stages.map((stage, index) => ({
    video_id: input.videoId,
    owner_id: input.ownerId,
    stage,
    status: 'queued',
    sequence: offset + index,
    payload: input.payload ?? {},
    scheduled_at: new Date().toISOString(),
  }));

  const { error } = await service.from('jobs').insert(rows);

  if (error) {
    throw new Error(`เข้าคิวงานไม่สำเร็จ: ${error.message}`);
  }
};

export const updateVideoStage = async (
  service: SupabaseClient,
  videoId: string,
  stage: JobStage,
) => {
  const state = STAGE_STATE[stage];

  await service
    .from('videos')
    .update({ status: state.status, progress: state.progress })
    .eq('id', videoId);
};

export const failVideo = async (
  service: SupabaseClient,
  videoId: string,
  message: string,
) => {
  await service.from('videos').update({ status: 'failed', error_message: message }).eq('id', videoId);
};

/** ยกเลิกงานที่เหลือของวิดีโอ เมื่อขั้นใดขั้นหนึ่งล้มเหลวถาวร */
export const cancelPendingJobs = async (service: SupabaseClient, videoId: string) => {
  await service
    .from('jobs')
    .update({ status: 'cancelled', finished_at: new Date().toISOString() })
    .eq('video_id', videoId)
    .eq('status', 'queued');
};
