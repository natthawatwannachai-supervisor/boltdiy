import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { LessonBrief, Scene, Video, VideoStatus } from '@/types/domain';
import type { JobRow, QualityReportRow, SubtitleCueRow, VideoRow } from '@/types/database';

export type VideoFilter = 'all' | 'in_progress' | 'completed' | 'draft';

const IN_PROGRESS: VideoStatus[] = [
  'analyzing',
  'scripting',
  'storyboarding',
  'generating_images',
  'generating_voice',
  'generating_subtitles',
  'rendering',
  'quality_check',
];

export const listVideos = async (filter: VideoFilter = 'all', projectId?: string) => {
  let query = supabase.from('videos').select('*').order('updated_at', { ascending: false });

  if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'draft') {
    query = query.eq('status', 'draft');
  } else if (filter === 'in_progress') {
    query = query.in('status', IN_PROGRESS);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  return unwrap(await query) as VideoRow[];
};

export const listRecentVideos = async (limit = 5) =>
  unwrap(
    await supabase.from('videos').select('*').order('updated_at', { ascending: false }).limit(limit),
  ) as VideoRow[];

export const listActiveVideos = async () =>
  unwrap(
    await supabase.from('videos').select('*').in('status', IN_PROGRESS).order('updated_at', { ascending: false }),
  ) as VideoRow[];

export const getVideo = async (id: string) =>
  unwrap(await supabase.from('videos').select('*').eq('id', id).single()) as VideoRow;

export const updateVideo = async (id: string, patch: Partial<VideoRow>) =>
  unwrap(await supabase.from('videos').update(patch).eq('id', id).select('*').single()) as VideoRow;

export const deleteVideo = async (id: string) => {
  const { error } = await supabase.from('videos').delete().eq('id', id);

  if (error) {
    throw error;
  }
};

export const listScenes = async (videoId: string) =>
  unwrap(
    await supabase.from('scenes').select('*').eq('video_id', videoId).order('index', { ascending: true }),
  ) as Scene[];

export const updateScene = async (id: string, patch: Partial<Scene>) =>
  unwrap(await supabase.from('scenes').update(patch).eq('id', id).select('*').single()) as Scene;

export const deleteScene = async (id: string) => {
  const { error } = await supabase.from('scenes').delete().eq('id', id);

  if (error) {
    throw error;
  }
};

/** บันทึกลำดับฉากใหม่หลังครูลากสลับตำแหน่งใน Storyboard */
export const reorderScenes = async (videoId: string, orderedIds: string[]) => {
  const { error } = await supabase.rpc('reorder_scenes' as never, {
    p_video_id: videoId,
    p_scene_ids: orderedIds,
  } as never);

  if (error) {
    throw error;
  }
};

export const listSubtitleCues = async (videoId: string) =>
  unwrap(
    await supabase
      .from('subtitle_cues')
      .select('*')
      .eq('video_id', videoId)
      .order('index', { ascending: true }),
  ) as SubtitleCueRow[];

export const getQualityReport = async (videoId: string) => {
  const { data, error } = await supabase
    .from('quality_reports')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as QualityReportRow | null;
};

export const listJobs = async (videoId: string) =>
  unwrap(
    await supabase.from('jobs').select('*').eq('video_id', videoId).order('created_at', { ascending: true }),
  ) as JobRow[];

/**
 * ฟังสถานะวิดีโอแบบเรียลไทม์ ระหว่างที่ AI ทำงานอยู่เบื้องหลัง
 * ครูปิดแอปได้ และเมื่อกลับเข้ามาจะเห็นความคืบหน้าล่าสุดทันที
 */
export const subscribeToVideo = (videoId: string, onChange: (video: VideoRow) => void) => {
  const channel = supabase
    .channel(`video:${videoId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'videos', filter: `id=eq.${videoId}` },
      (payload) => onChange(payload.new as VideoRow),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};

export const subscribeToScenes = (videoId: string, onChange: () => void) => {
  const channel = supabase
    .channel(`scenes:${videoId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scenes', filter: `video_id=eq.${videoId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};

export type { LessonBrief, Video };
