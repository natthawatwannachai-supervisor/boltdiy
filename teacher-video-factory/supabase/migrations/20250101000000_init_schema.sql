-- =============================================================================
-- Teacher Video Factory — โครงสร้างฐานข้อมูลหลัก
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type education_stage as enum ('kindergarten', 'primary', 'secondary', 'vocational', 'other');

create type grade_level as enum (
  'k1','k2','k3',
  'p1','p2','p3','p4','p5','p6',
  'm1','m2','m3','m4','m5','m6',
  'voc','other'
);

create type subject_key as enum (
  'thai','math','science','social','english',
  'health','art','career','technology','foreign','other'
);

create type video_format as enum (
  'lesson','story','experiment','concept','news','exam_prep','micro','short','animation'
);

create type visual_style as enum (
  'teacher_talk','animation','infographic','cartoon','cinematic','minimal','three_d','whiteboard'
);

create type aspect_ratio as enum ('16:9','9:16','1:1');
create type resolution as enum ('720p','1080p');

create type video_status as enum (
  'draft','analyzing','scripting','storyboarding','generating_images',
  'generating_voice','generating_subtitles','rendering','quality_check','completed','failed'
);

create type job_stage as enum (
  'analyze','objectives','script','storyboard','images','voice','subtitles','render','quality','thumbnail'
);

create type job_status as enum ('queued','running','succeeded','failed','cancelled');
create type plan_key as enum ('free','teacher','pro_teacher','school');
create type subscription_status as enum ('active','past_due','cancelled','trialing');
create type asset_kind as enum ('image','audio','video','thumbnail','document');
create type generation_status as enum ('pending','generating','ready','failed');
create type subtitle_style as enum ('bottom','highlight','karaoke','caption');
create type notification_kind as enum ('video_ready','credits','system','milestone');
create type user_role as enum ('teacher','admin');

-- ---------------------------------------------------------------------------
-- แค็ตตาล็อก (อ่านได้ทุกคน แก้ไขได้เฉพาะ service role)
-- ---------------------------------------------------------------------------
create table plans (
  key plan_key primary key,
  name text not null,
  price_thb integer not null,
  videos_per_month integer not null,
  max_duration_min integer not null,
  max_resolution resolution not null default '720p',
  watermark boolean not null default true,
  monthly_credits integer not null default 0,
  seats integer not null default 1,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table ai_credit_costs (
  action text primary key,
  credits integer not null check (credits >= 0),
  label text not null
);

create table voices (
  id text primary key,
  label text not null,
  gender text not null check (gender in ('male','female')),
  tone text not null,
  language text not null default 'th',
  -- map ไป voice id จริงของแต่ละผู้ให้บริการ TTS เพื่อสลับ provider ได้
  provider_voice jsonb not null default '{}'::jsonb,
  premium boolean not null default false,
  sample_url text,
  sort_order integer not null default 0
);

create table music_tracks (
  id text primary key,
  label text not null,
  mood text not null,
  license text not null,
  attribution text,
  storage_path text,
  preview_url text,
  -- บังคับให้ทุกแทร็กในระบบใช้เชิงพาณิชย์ได้ (สเปกข้อ 16)
  commercial_use boolean not null default true check (commercial_use)
);

create table credit_packs (
  id text primary key,
  credits integer not null,
  price_thb integer not null,
  bonus_label text,
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- ผู้ใช้
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  position text,
  school text,
  affiliation text,
  education_stage education_stage,
  grade_levels grade_level[] not null default '{}',
  subjects subject_key[] not null default '{}',
  avatar_url text,
  phone text,
  role user_role not null default 'teacher',
  referral_code text not null unique,
  referred_by uuid references profiles(id) on delete set null,
  onboarded_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index profiles_referral_code_idx on profiles (referral_code);
create index profiles_last_active_idx on profiles (last_active_at desc);

create table subscriptions (
  user_id uuid primary key references profiles(id) on delete cascade,
  plan plan_key not null default 'free' references plans(key),
  status subscription_status not null default 'active',
  videos_used_this_period integer not null default 0,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_subscription_id text,
  school_id uuid,
  first_paid_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index subscriptions_plan_idx on subscriptions (plan, status);

create table credit_wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  monthly_grant integer not null default 0,
  updated_at timestamptz not null default now()
);

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  reason text not null,
  action text,
  video_id uuid,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_idx on credit_transactions (user_id, created_at desc);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  signup_rewarded boolean not null default false,
  upgrade_rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (referred_id)
);

create index referrals_referrer_idx on referrals (referrer_id);

create table push_tokens (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null,
  created_at timestamptz not null default now()
);

create index push_tokens_user_idx on push_tokens (user_id);

-- ---------------------------------------------------------------------------
-- เนื้อหา
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  subject subject_key,
  grade_level grade_level,
  color text not null default '#1D4ED8',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_idx on projects (owner_id, updated_at desc);

create table templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject subject_key not null,
  grade_levels grade_level[] not null default '{}',
  format video_format not null default 'lesson',
  style visual_style not null default 'animation',
  duration_min integer not null default 5,
  cover_url text,
  outline jsonb not null default '[]'::jsonb,
  usage_count integer not null default 0,
  is_official boolean not null default false,
  is_public boolean not null default true,
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index templates_subject_idx on templates (subject, usage_count desc);
create index templates_title_trgm_idx on templates using gin (title gin_trgm_ops);

create table videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  template_id uuid references templates(id) on delete set null,
  title text not null,
  topic text not null,
  grade_level grade_level not null default 'p5',
  subject subject_key not null default 'science',
  duration_min integer not null default 5,
  format video_format not null default 'lesson',
  style visual_style not null default 'animation',
  aspect_ratio aspect_ratio not null default '16:9',
  resolution resolution not null default '720p',
  objectives jsonb not null default '[]'::jsonb,
  voice_id text references voices(id) on delete set null,
  voice_speed numeric(3,2) not null default 1.00,
  voice_pitch numeric(3,1) not null default 0.0,
  voice_volume numeric(3,2) not null default 1.00,
  subtitle_enabled boolean not null default true,
  subtitle_style subtitle_style not null default 'bottom',
  subtitle_language text not null default 'th',
  subtitle_font text not null default 'Sarabun',
  subtitle_size integer not null default 32,
  music_id text references music_tracks(id) on delete set null,
  school_logo_url text,
  status video_status not null default 'draft',
  progress integer not null default 0 check (progress between 0 and 100),
  video_url text,
  thumbnail_url text,
  watermarked boolean not null default true,
  quality_score integer,
  error_message text,
  auto_pilot boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index videos_owner_idx on videos (owner_id, updated_at desc);
create index videos_project_idx on videos (project_id);
create index videos_status_idx on videos (status) where status <> 'completed';

create table scenes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  index integer not null,
  start_sec integer not null default 0,
  end_sec integer not null default 0,
  visual_description text not null default '',
  narration text not null default '',
  on_screen_text text,
  transition text,
  image_prompt text,
  image_url text,
  image_status generation_status not null default 'pending',
  audio_url text,
  audio_status generation_status not null default 'pending',
  audio_duration_sec numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, index) deferrable initially deferred
);

create index scenes_video_idx on scenes (video_id, index);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  version integer not null default 1,
  hook text not null default '',
  summary text not null default '',
  full_text text not null default '',
  model text,
  created_at timestamptz not null default now()
);

create index scripts_video_idx on scripts (video_id, version desc);

create table storyboards (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  version integer not null default 1,
  scenes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table subtitle_cues (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  scene_id uuid references scenes(id) on delete cascade,
  index integer not null,
  start_sec numeric(7,2) not null,
  end_sec numeric(7,2) not null,
  text_th text not null,
  text_en text,
  keywords text[] not null default '{}'
);

create index subtitle_cues_video_idx on subtitle_cues (video_id, index);

create table assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  video_id uuid references videos(id) on delete cascade,
  scene_id uuid references scenes(id) on delete cascade,
  kind asset_kind not null,
  storage_path text not null,
  public_url text,
  mime_type text,
  bytes bigint,
  provider text,
  created_at timestamptz not null default now()
);

create index assets_owner_idx on assets (owner_id, created_at desc);
create index assets_video_idx on assets (video_id);

create table quality_reports (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index quality_reports_video_idx on quality_reports (video_id, created_at desc);

create table lesson_kits (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'generating' check (status in ('generating','ready','failed')),
  lesson_plan text,
  slides_outline text,
  worksheet text,
  quiz text,
  handout text,
  created_at timestamptz not null default now()
);

create index lesson_kits_video_idx on lesson_kits (video_id, created_at desc);

-- ---------------------------------------------------------------------------
-- คิวงานเบื้องหลัง (สเปกข้อ 32)
-- ---------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  stage job_stage not null,
  status job_status not null default 'queued',
  -- ลำดับขั้นภายในวิดีโอเดียวกัน ใช้บังคับให้สายพานทำงานตามลำดับเสมอ
  -- แม้ขั้นก่อนหน้าจะถูกเลื่อนเวลาออกไปเพราะ retry
  sequence integer not null default 0,
  attempts integer not null default 0,
  -- render ล้มเหลวต้อง retry อัตโนมัติอย่างน้อย 2 ครั้ง (สเปกข้อ 38)
  max_attempts integer not null default 3,
  progress integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index jobs_queue_idx on jobs (status, scheduled_at) where status in ('queued','running');
create index jobs_sequence_idx on jobs (video_id, sequence) where status in ('queued','running');
create index jobs_video_idx on jobs (video_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind notification_kind not null default 'system',
  video_id uuid references videos(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ผู้ช่วย AI ในแอป
-- ---------------------------------------------------------------------------
create table assistant_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  video_id uuid references videos(id) on delete set null,
  title text not null default 'สนทนาใหม่',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references assistant_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  artifact jsonb,
  created_at timestamptz not null default now()
);

create index assistant_messages_thread_idx on assistant_messages (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- Analytics (สเปกข้อ 29)
-- ---------------------------------------------------------------------------
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_event_idx on analytics_events (event, created_at desc);
create index analytics_events_user_idx on analytics_events (user_id, created_at desc);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('subscription','credits')),
  amount_thb integer not null,
  credits integer,
  plan plan_key,
  provider text not null,
  provider_reference text unique,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payments_user_idx on payments (user_id, created_at desc);

-- บันทึกต้นทุนที่จ่ายให้ผู้ให้บริการ AI จริง เพื่อคำนวณกำไรต่อวิดีโอ
create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  video_id uuid references videos(id) on delete set null,
  action text not null,
  provider text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_thb numeric(10,4) not null default 0,
  latency_ms integer,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index ai_usage_logs_created_idx on ai_usage_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

create trigger videos_updated_at before update on videos
  for each row execute function set_updated_at();

create trigger scenes_updated_at before update on scenes
  for each row execute function set_updated_at();

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create trigger assistant_threads_updated_at before update on assistant_threads
  for each row execute function set_updated_at();
