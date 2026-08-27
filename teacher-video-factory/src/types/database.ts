import type {
  AspectRatio,
  EducationStage,
  GradeLevel,
  JobStage,
  JobStatus,
  LearningObjective,
  MusicMood,
  PlanKey,
  Profile,
  Project,
  QualityReport,
  Resolution,
  Scene,
  SubjectKey,
  SubtitleStyle,
  Template,
  Video,
  VideoFormat,
  VideoStatus,
  VisualStyle,
  VoiceGender,
  VoiceTone,
} from './domain';

/**
 * โครงสร้างตารางฝั่ง PostgreSQL — ต้องตรงกับ supabase/migrations
 * (ในโปรเจกต์จริงสามารถแทนที่ไฟล์นี้ด้วย `supabase gen types typescript` ได้)
 */
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>, Rel extends Relationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rel;
};

/** ความสัมพันธ์ที่ postgrest ใช้ตอน embed เช่น projects.select('*, videos(count)') */
type VideoRelationships = [
  {
    foreignKeyName: 'videos_project_id_fkey';
    columns: ['project_id'];
    isOneToOne: false;
    referencedRelation: 'projects';
    referencedColumns: ['id'];
  },
  {
    foreignKeyName: 'videos_owner_id_fkey';
    columns: ['owner_id'];
    isOneToOne: false;
    referencedRelation: 'profiles';
    referencedColumns: ['id'];
  },
];

export type CreditTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  action: string | null;
  video_id: string | null;
  created_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: 'video_ready' | 'credits' | 'system' | 'milestone';
  video_id: string | null;
  read_at: string | null;
  created_at: string;
}

export type JobRow = {
  id: string;
  video_id: string;
  owner_id: string;
  stage: JobStage;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  progress: number;
  payload: Record<string, unknown>;
  error_message: string | null;
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export type SubtitleCueRow = {
  id: string;
  video_id: string;
  scene_id: string | null;
  index: number;
  start_sec: number;
  end_sec: number;
  text_th: string;
  text_en: string | null;
  keywords: string[];
}

export type AssetRow = {
  id: string;
  owner_id: string;
  video_id: string | null;
  scene_id: string | null;
  kind: 'image' | 'audio' | 'video' | 'thumbnail' | 'document';
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  bytes: number | null;
  provider: string | null;
  created_at: string;
}

export type VoiceRow = {
  id: string;
  label: string;
  gender: VoiceGender;
  tone: VoiceTone;
  language: 'th' | 'en';
  provider_voice: Record<string, string>;
  premium: boolean;
  sample_url: string | null;
  sort_order: number;
}

export type MusicTrackRow = {
  id: string;
  label: string;
  mood: MusicMood;
  license: string;
  attribution: string | null;
  storage_path: string | null;
  preview_url: string | null;
  commercial_use: boolean;
}

export type SubscriptionRow = {
  user_id: string;
  plan: PlanKey;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  videos_used_this_period: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider: string | null;
  provider_subscription_id: string | null;
  school_id: string | null;
  updated_at: string;
}

export type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  signup_rewarded: boolean;
  upgrade_rewarded: boolean;
  created_at: string;
}

export type ScriptRow = {
  id: string;
  video_id: string;
  version: number;
  hook: string;
  summary: string;
  full_text: string;
  model: string | null;
  created_at: string;
}

export type StoryboardRow = {
  id: string;
  video_id: string;
  version: number;
  scenes: Pick<Scene, 'index' | 'visual_description' | 'image_prompt' | 'start_sec' | 'end_sec'>[];
  created_at: string;
}

export type QualityReportRow = {
  id: string;
  video_id: string;
  score: number;
  report: QualityReport;
  created_at: string;
}

export type LessonKitRow = {
  id: string;
  video_id: string;
  owner_id: string;
  status: 'generating' | 'ready' | 'failed';
  lesson_plan: string | null;
  worksheet: string | null;
  quiz: string | null;
  handout: string | null;
  slides_outline: string | null;
  created_at: string;
}

export type AssistantThreadRow = {
  id: string;
  owner_id: string;
  video_id: string | null;
  title: string;
  updated_at: string;
  created_at: string;
}

export type AssistantMessageRow = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  /** ผลลัพธ์ที่ AI สร้าง เช่น แบบทดสอบ/ใบงาน เก็บเป็น JSON เพื่อนำไปใช้ต่อ */
  artifact: Record<string, unknown> | null;
  created_at: string;
}

export type AnalyticsEventRow = {
  id: string;
  user_id: string | null;
  event: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export type PlanRow = {
  key: PlanKey;
  name: string;
  price_thb: number;
  videos_per_month: number;
  max_duration_min: number;
  max_resolution: Resolution;
  watermark: boolean;
  monthly_credits: number;
  seats: number;
  features: string[];
  active: boolean;
}

export type CreditCostRow = {
  action: string;
  credits: number;
  label: string;
}

export type VideoRow = Video & {
  music_id: string | null;
  template_id: string | null;
  school_logo_url: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }>;
      projects: Table<Project, Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string }>;
      videos: Table<
        VideoRow,
        Partial<VideoRow> & { owner_id: string; title: string; topic: string },
        Partial<VideoRow>,
        VideoRelationships
      >;
      scenes: Table<Scene, Partial<Scene> & { video_id: string; index: number }>;
      scripts: Table<ScriptRow, Omit<ScriptRow, 'id' | 'created_at'>>;
      storyboards: Table<StoryboardRow, Omit<StoryboardRow, 'id' | 'created_at'>>;
      subtitle_cues: Table<SubtitleCueRow, Omit<SubtitleCueRow, 'id'>>;
      assets: Table<AssetRow, Omit<AssetRow, 'id' | 'created_at'>>;
      voices: Table<VoiceRow>;
      music_tracks: Table<MusicTrackRow>;
      templates: Table<Template, Omit<Template, 'id' | 'usage_count'>>;
      plans: Table<PlanRow>;
      subscriptions: Table<SubscriptionRow, Partial<SubscriptionRow> & { user_id: string }>;
      credit_wallets: Table<{ user_id: string; balance: number; monthly_grant: number; updated_at: string }>;
      credit_transactions: Table<CreditTransactionRow, Omit<CreditTransactionRow, 'id' | 'created_at'>>;
      ai_credit_costs: Table<CreditCostRow>;
      referrals: Table<ReferralRow, Omit<ReferralRow, 'id' | 'created_at'>>;
      jobs: Table<JobRow, Partial<JobRow> & { video_id: string; owner_id: string; stage: JobStage }>;
      notifications: Table<NotificationRow, Omit<NotificationRow, 'id' | 'created_at' | 'read_at'>>;
      quality_reports: Table<QualityReportRow, Omit<QualityReportRow, 'id' | 'created_at'>>;
      lesson_kits: Table<LessonKitRow, Partial<LessonKitRow> & { video_id: string; owner_id: string }>;
      assistant_threads: Table<AssistantThreadRow, Partial<AssistantThreadRow> & { owner_id: string }>;
      assistant_messages: Table<AssistantMessageRow, Omit<AssistantMessageRow, 'id' | 'created_at'>>;
      analytics_events: Table<AnalyticsEventRow, Omit<AnalyticsEventRow, 'id' | 'created_at'>>;
      push_tokens: Table<{ user_id: string; token: string; platform: string; created_at: string }>;
    };
    Views: {
      admin_overview: {
        Row: {
          total_users: number;
          active_users_30d: number;
          free_users: number;
          paid_users: number;
          mrr_thb: number;
          videos_total: number;
          videos_30d: number;
          credits_spent_30d: number;
          ai_cost_thb_30d: number;
          conversion_rate: number;
          churn_rate: number;
        };
        Relationships: [];
      };
      admin_daily_stats: {
        Row: {
          day: string;
          signups: number;
          videos_created: number;
          revenue_thb: number;
          credits_spent: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      spend_credits: {
        Args: { p_action: string; p_video_id: string | null; p_quantity: number };
        Returns: { balance: number; spent: number }[];
      };
      redeem_referral_code: {
        Args: { p_code: string };
        Returns: { rewarded: number }[];
      };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      export_my_data: { Args: Record<string, never>; Returns: Record<string, unknown> };
    };
    Enums: {
      video_status: VideoStatus;
      job_stage: JobStage;
      job_status: JobStatus;
      grade_level: GradeLevel;
      subject_key: SubjectKey;
      video_format: VideoFormat;
      visual_style: VisualStyle;
      aspect_ratio: AspectRatio;
      resolution: Resolution;
      plan_key: PlanKey;
      education_stage: EducationStage;
      subtitle_style: SubtitleStyle;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type { LearningObjective };
