import type { LessonContext } from './prompts.ts';

export interface VideoRecord {
  id: string;
  owner_id: string;
  title: string;
  topic: string;
  grade_level: string;
  subject: string;
  duration_min: number;
  format: string;
  style: string;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  resolution: '720p' | '1080p';
  objectives: { id: string; text: string; bloom?: string }[];
  voice_id: string | null;
  voice_speed: number;
  voice_pitch: number;
  voice_volume: number;
  subtitle_enabled: boolean;
  subtitle_style: string;
  subtitle_language: 'th' | 'en';
  subtitle_font: string;
  subtitle_size: number;
  music_id: string | null;
  school_logo_url: string | null;
  status: string;
  progress: number;
  watermarked: boolean;
  auto_pilot: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  quality_score: number | null;
  error_message: string | null;
  project_id: string | null;
  template_id: string | null;
  completed_at: string | null;
}

export const toLessonContext = (video: VideoRecord): LessonContext => ({
  topic: video.topic,
  gradeLevel: video.grade_level,
  subject: video.subject,
  durationMin: video.duration_min,
  format: video.format,
  style: video.style,
  objectives: (video.objectives ?? []).map((objective) => objective.text),
});

/** ราว 20–25 วินาทีต่อฉาก ทำให้จังหวะการเล่าเรื่องพอดีกับสมาธิของผู้เรียน */
export const planScenes = (durationMin: number) => {
  const totalSeconds = durationMin * 60;
  const sceneCount = Math.max(3, Math.round(totalSeconds / 22));

  return {
    totalSeconds,
    sceneCount,
    secondsPerScene: Math.round(totalSeconds / sceneCount),
  };
};
