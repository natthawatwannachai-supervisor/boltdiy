/** ชนิดข้อมูลกลางที่ใช้ร่วมกันระหว่างหน้าจอ, API layer และ Edge Functions */

export type EducationStage = 'kindergarten' | 'primary' | 'secondary' | 'vocational' | 'other';

export type GradeLevel =
  | 'k1' | 'k2' | 'k3'
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'
  | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6'
  | 'voc' | 'other';

export type SubjectKey =
  | 'thai' | 'math' | 'science' | 'social' | 'english'
  | 'health' | 'art' | 'career' | 'technology' | 'foreign' | 'other';

export type VideoFormat =
  | 'lesson' | 'story' | 'experiment' | 'concept'
  | 'news' | 'exam_prep' | 'micro' | 'short' | 'animation';

export type VisualStyle =
  | 'teacher_talk' | 'animation' | 'infographic' | 'cartoon'
  | 'cinematic' | 'minimal' | 'three_d' | 'whiteboard';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '720p' | '1080p';

export type VideoStatus =
  | 'draft'
  | 'analyzing'
  | 'scripting'
  | 'storyboarding'
  | 'generating_images'
  | 'generating_voice'
  | 'generating_subtitles'
  | 'rendering'
  | 'quality_check'
  | 'completed'
  | 'failed';

export type JobStage =
  | 'analyze' | 'objectives' | 'script' | 'storyboard'
  | 'images' | 'voice' | 'subtitles' | 'render' | 'quality' | 'thumbnail';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type PlanKey = 'free' | 'teacher' | 'pro_teacher' | 'school';

export type VoiceGender = 'male' | 'female';
export type VoiceTone = 'professional' | 'warm' | 'cheerful' | 'playful' | 'serious' | 'documentary';

export type SubtitleStyle = 'bottom' | 'highlight' | 'karaoke' | 'caption';
export type MusicMood = 'fun' | 'calm' | 'science' | 'adventure' | 'emotional' | 'corporate' | 'kids' | 'none';

export type LearningObjective = {
  id: string;
  text: string;
  /** ระดับพฤติกรรมตาม Bloom's taxonomy ฉบับย่อ ใช้ตรวจคุณภาพ */
  bloom?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export type Scene = {
  id: string;
  video_id: string;
  index: number;
  /** วินาทีที่เริ่ม/จบ เทียบจากต้นคลิป */
  start_sec: number;
  end_sec: number;
  visual_description: string;
  narration: string;
  on_screen_text: string | null;
  transition: string | null;
  image_prompt: string | null;
  image_url: string | null;
  image_status: 'pending' | 'generating' | 'ready' | 'failed';
  audio_url: string | null;
  audio_status: 'pending' | 'generating' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export type LessonBrief = {
  topic: string;
  grade_level: GradeLevel;
  subject: SubjectKey;
  duration_min: number;
  format: VideoFormat;
  style: VisualStyle;
}

export type Video = {
  id: string;
  owner_id: string;
  project_id: string | null;
  title: string;
  topic: string;
  grade_level: GradeLevel;
  subject: SubjectKey;
  duration_min: number;
  format: VideoFormat;
  style: VisualStyle;
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  objectives: LearningObjective[];
  voice_id: string | null;
  voice_speed: number;
  voice_pitch: number;
  voice_volume: number;
  subtitle_enabled: boolean;
  subtitle_style: SubtitleStyle;
  subtitle_language: 'th' | 'en';
  subtitle_font: string;
  subtitle_size: number;
  music_id: string | null;
  status: VideoStatus;
  progress: number;
  video_url: string | null;
  thumbnail_url: string | null;
  watermarked: boolean;
  quality_score: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  subject: SubjectKey | null;
  grade_level: GradeLevel | null;
  color: string;
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  school: string | null;
  affiliation: string | null;
  education_stage: EducationStage | null;
  grade_levels: GradeLevel[];
  subjects: SubjectKey[];
  avatar_url: string | null;
  phone: string | null;
  role: 'teacher' | 'admin';
  referral_code: string;
  referred_by: string | null;
  onboarded_at: string | null;
  created_at: string;
}

export type CreditWallet = {
  user_id: string;
  balance: number;
  monthly_grant: number;
  updated_at: string;
}

export type Subscription = {
  user_id: string;
  plan: PlanKey;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  videos_used_this_period: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export type QualityReport = {
  score: number;
  checks: {
    key: 'content' | 'script' | 'visual' | 'audio' | 'subtitle' | 'objective';
    label: string;
    passed: boolean;
    detail: string;
  }[];
  suggestions: string[];
}

export type Template = {
  id: string;
  title: string;
  description: string | null;
  subject: SubjectKey;
  grade_levels: GradeLevel[];
  format: VideoFormat;
  style: VisualStyle;
  duration_min: number;
  cover_url: string | null;
  usage_count: number;
  is_official: boolean;
  is_public: boolean;
  author_id: string | null;
  outline: { title: string; summary: string }[];
}
