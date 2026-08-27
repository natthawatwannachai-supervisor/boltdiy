import { invokeFunction } from './client';
import type {
  AspectRatio,
  LearningObjective,
  LessonBrief,
  QualityReport,
  Resolution,
  Scene,
  SubtitleStyle,
} from '@/types/domain';
import type { VideoRow } from '@/types/database';

/**
 * ทุกฟังก์ชันในไฟล์นี้เรียก Supabase Edge Function ซึ่งเป็นที่เดียวที่ถือ API key ของ AI
 * ฝั่ง Edge Function ใช้ AI Service Layer ที่สลับผู้ให้บริการได้ (Anthropic / OpenAI / Gemini)
 */

export interface AnalyzeResult {
  brief: LessonBrief;
  /** ระบบเดาข้อมูลอะไรมาจากประโยคเดียวของครูบ้าง ใช้แสดงหน้า "พบข้อมูล" */
  detected: { field: keyof LessonBrief; label: string; value: string }[];
  suggested_title: string;
}

/** ขั้นตอนเดียว: ครูพิมพ์ "การสังเคราะห์แสง ป.6 ความยาว 5 นาที" */
export const analyzeTopic = (prompt: string) =>
  invokeFunction<AnalyzeResult>('ai-analyze', { prompt });

/** สร้างวิดีโอใหม่จากบทเรียน แล้วเข้าคิว pipeline อัตโนมัติทั้งหมด */
export const createVideoFromBrief = (input: {
  brief: LessonBrief;
  title?: string;
  project_id?: string | null;
  template_id?: string | null;
  /** true = ให้ AI ทำครบทุกขั้นจนได้ไฟล์วิดีโอโดยไม่ต้องกดยืนยันทีละขั้น */
  auto_pilot: boolean;
}) => invokeFunction<{ video: VideoRow }>('video-create', input);

export const generateObjectives = (videoId: string) =>
  invokeFunction<{ objectives: LearningObjective[] }>('ai-objectives', { video_id: videoId });

export const generateScript = (videoId: string) =>
  invokeFunction<{ scenes: Scene[] }>('ai-script', { video_id: videoId });

export const regenerateScene = (videoId: string, sceneId: string, instruction?: string) =>
  invokeFunction<{ scene: Scene }>('ai-script', {
    video_id: videoId,
    scene_id: sceneId,
    instruction,
    mode: 'regenerate_scene',
  });

export const addScene = (videoId: string, afterSceneId: string | null) =>
  invokeFunction<{ scene: Scene }>('ai-script', {
    video_id: videoId,
    after_scene_id: afterSceneId,
    mode: 'add_scene',
  });

export const generateStoryboard = (videoId: string) =>
  invokeFunction<{ scenes: Scene[] }>('ai-storyboard', { video_id: videoId });

export const generateSceneImage = (input: {
  video_id: string;
  scene_id: string;
  prompt_override?: string;
  style_override?: string;
}) => invokeFunction<{ scene: Scene }>('ai-image', input);

export const generateAllImages = (videoId: string) =>
  invokeFunction<{ queued: number }>('ai-image', { video_id: videoId, mode: 'all' });

export const previewVoice = (input: {
  voice_id: string;
  text: string;
  speed: number;
  pitch: number;
  language: 'th' | 'en';
}) => invokeFunction<{ audio_url: string }>('ai-voice', { ...input, mode: 'preview' });

export const generateVoiceOver = (videoId: string) =>
  invokeFunction<{ queued: number }>('ai-voice', { video_id: videoId, mode: 'all' });

export const generateSubtitles = (input: {
  video_id: string;
  language: 'th' | 'en';
  style: SubtitleStyle;
}) => invokeFunction<{ cues: number }>('ai-subtitles', input);

export const renderVideo = (videoId: string) =>
  invokeFunction<{ job_id: string }>('video-render', { video_id: videoId });

export const runQualityCheck = (videoId: string) =>
  invokeFunction<{ report: QualityReport }>('ai-quality', { video_id: videoId });

export interface ThumbnailOption {
  id: string;
  headline: string;
  url: string;
}

export const generateThumbnails = (videoId: string) =>
  invokeFunction<{ options: ThumbnailOption[] }>('ai-thumbnail', { video_id: videoId });

export const selectThumbnail = (videoId: string, thumbnailId: string) =>
  invokeFunction<{ video: VideoRow }>('ai-thumbnail', {
    video_id: videoId,
    thumbnail_id: thumbnailId,
    mode: 'select',
  });

export interface ExportResult {
  /** ready = ไฟล์พร้อมดาวน์โหลดทันที, queued = ต้อง render ใหม่ตามรูปแบบที่เลือก */
  status: 'ready' | 'queued';
  download_url: string | null;
  expires_at: string | null;
}

export const exportVideo = (input: {
  video_id: string;
  aspect_ratio: AspectRatio;
  resolution: Resolution;
}) => invokeFunction<ExportResult>('video-export', input);

/** ฟีเจอร์พรีเมียม: สร้างชุดสื่อการสอนครบชุดจากวิดีโอที่ทำเสร็จแล้ว */
export const generateLessonKit = (videoId: string) =>
  invokeFunction<{ kit_id: string }>('ai-lesson-kit', { video_id: videoId });
