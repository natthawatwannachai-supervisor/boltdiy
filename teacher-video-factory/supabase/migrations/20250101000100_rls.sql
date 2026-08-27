-- =============================================================================
-- Row Level Security — ทุกตารางเปิด RLS และผู้ใช้เห็นได้เฉพาะข้อมูลของตนเอง
-- การเขียนที่กระทบเงิน/เครดิต/สถานะงาน ทำได้เฉพาะ service role (Edge Function)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ฟังก์ชันช่วยตรวจสิทธิ์ (security definer เพื่อเลี่ยง recursive RLS)
-- ---------------------------------------------------------------------------
create or replace function auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function owns_video(p_video_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from videos where id = p_video_id and owner_id = auth.uid()
  );
$$;

create or replace function owns_thread(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from assistant_threads where id = p_thread_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- แค็ตตาล็อกสาธารณะ — อ่านได้ทุกคนที่ล็อกอิน แก้ไขได้เฉพาะ service role
-- ---------------------------------------------------------------------------
alter table plans enable row level security;
alter table ai_credit_costs enable row level security;
alter table voices enable row level security;
alter table music_tracks enable row level security;
alter table credit_packs enable row level security;

-- อ่านรายการแพ็กเกจได้ทุกคน
create policy "plans_read_all" on plans for select to authenticated, anon using (true);
-- อ่านอัตราการใช้เครดิตได้ทุกคนที่ล็อกอิน
create policy "credit_costs_read_all" on ai_credit_costs for select to authenticated using (true);
-- อ่านรายการเสียงบรรยายได้ทุกคนที่ล็อกอิน
create policy "voices_read_all" on voices for select to authenticated using (true);
-- อ่านรายการเพลงประกอบได้ทุกคนที่ล็อกอิน
create policy "music_read_all" on music_tracks for select to authenticated using (true);
-- อ่านรายการแพ็กเครดิตได้ทุกคน
create policy "credit_packs_read_all" on credit_packs for select to authenticated, anon using (true);

-- ---------------------------------------------------------------------------
-- โปรไฟล์
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

-- อ่านโปรไฟล์ของตัวเอง (ผู้ดูแลอ่านได้ทั้งหมด)
create policy "profiles_read_own" on profiles
  for select to authenticated
  using (id = auth.uid() or auth_is_admin());

-- แก้ไขได้เฉพาะโปรไฟล์ของตัวเอง
create policy "profiles_update_own" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- เครดิตและแพ็กเกจ — ผู้ใช้อ่านได้อย่างเดียว การหักเครดิตทำผ่าน RPC/Edge เท่านั้น
-- ---------------------------------------------------------------------------
alter table credit_wallets enable row level security;
alter table credit_transactions enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table referrals enable row level security;

-- อ่านยอดเครดิตของตัวเอง
create policy "wallet_read_own" on credit_wallets
  for select to authenticated using (user_id = auth.uid() or auth_is_admin());

-- อ่านประวัติการใช้เครดิตของตัวเอง
create policy "credit_tx_read_own" on credit_transactions
  for select to authenticated using (user_id = auth.uid() or auth_is_admin());

-- อ่านแพ็กเกจที่ตัวเองใช้อยู่
create policy "subscription_read_own" on subscriptions
  for select to authenticated using (user_id = auth.uid() or auth_is_admin());

-- อ่านรายการชำระเงินของตัวเอง
create policy "payments_read_own" on payments
  for select to authenticated using (user_id = auth.uid() or auth_is_admin());

-- อ่านรายการเชิญเพื่อนที่เกี่ยวข้องกับตัวเอง
create policy "referrals_read_own" on referrals
  for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or auth_is_admin());

-- ---------------------------------------------------------------------------
-- Push token
-- ---------------------------------------------------------------------------
alter table push_tokens enable row level security;

-- จัดการ push token ของอุปกรณ์ตัวเอง
create policy "push_tokens_manage_own" on push_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- โปรเจกต์และวิดีโอ
-- ---------------------------------------------------------------------------
alter table projects enable row level security;
alter table videos enable row level security;

-- จัดการโปรเจกต์ของตัวเอง
create policy "projects_manage_own" on projects
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- จัดการวิดีโอของตัวเอง (ผู้ดูแลอ่านได้ทั้งหมด)
create policy "videos_manage_own" on videos
  for all to authenticated
  using (owner_id = auth.uid() or auth_is_admin())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ข้อมูลลูกของวิดีโอ — สิทธิ์ตามเจ้าของวิดีโอ
-- ---------------------------------------------------------------------------
alter table scenes enable row level security;
alter table scripts enable row level security;
alter table storyboards enable row level security;
alter table subtitle_cues enable row level security;
alter table quality_reports enable row level security;
alter table lesson_kits enable row level security;
alter table jobs enable row level security;

-- จัดการฉากของวิดีโอที่ตัวเองเป็นเจ้าของ
create policy "scenes_manage_own" on scenes
  for all to authenticated
  using (owns_video(video_id))
  with check (owns_video(video_id));

-- อ่านบทของวิดีโอที่ตัวเองเป็นเจ้าของ
create policy "scripts_read_own" on scripts
  for select to authenticated using (owns_video(video_id));

-- อ่าน storyboard ของวิดีโอที่ตัวเองเป็นเจ้าของ
create policy "storyboards_read_own" on storyboards
  for select to authenticated using (owns_video(video_id));

-- อ่าน subtitle ของวิดีโอที่ตัวเองเป็นเจ้าของ
create policy "subtitles_read_own" on subtitle_cues
  for select to authenticated using (owns_video(video_id));

-- อ่านผลตรวจคุณภาพของวิดีโอที่ตัวเองเป็นเจ้าของ
create policy "quality_read_own" on quality_reports
  for select to authenticated using (owns_video(video_id));

-- อ่านชุดสื่อการสอนของตัวเอง
create policy "lesson_kits_read_own" on lesson_kits
  for select to authenticated using (owner_id = auth.uid());

-- ติดตามสถานะงานเบื้องหลังของวิดีโอตัวเอง
create policy "jobs_read_own" on jobs
  for select to authenticated using (owner_id = auth.uid() or auth_is_admin());

-- ---------------------------------------------------------------------------
-- ไฟล์
-- ---------------------------------------------------------------------------
alter table assets enable row level security;

-- อ่านรายการไฟล์ของตัวเอง
create policy "assets_read_own" on assets
  for select to authenticated using (owner_id = auth.uid());

-- ลบไฟล์ของตัวเอง
create policy "assets_delete_own" on assets
  for delete to authenticated using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- เทมเพลต — เห็นของทางการและของสาธารณะ แก้ไขได้เฉพาะของตัวเอง
-- ---------------------------------------------------------------------------
alter table templates enable row level security;

-- อ่านเทมเพลตสาธารณะและเทมเพลตส่วนตัวของตัวเอง
create policy "templates_read_public_or_own" on templates
  for select to authenticated
  using (is_public or author_id = auth.uid());

-- สร้างเทมเพลตส่วนตัว (ตั้งเป็นเทมเพลตทางการเองไม่ได้)
create policy "templates_insert_own" on templates
  for insert to authenticated
  with check (author_id = auth.uid() and is_official = false);

-- แก้ไขเฉพาะเทมเพลตที่ตัวเองสร้าง
create policy "templates_update_own" on templates
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and is_official = false);

-- ลบเฉพาะเทมเพลตที่ตัวเองสร้าง
create policy "templates_delete_own" on templates
  for delete to authenticated using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- การแจ้งเตือน
-- ---------------------------------------------------------------------------
alter table notifications enable row level security;

-- อ่านการแจ้งเตือนของตัวเอง
create policy "notifications_read_own" on notifications
  for select to authenticated using (user_id = auth.uid());

-- ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
create policy "notifications_mark_read" on notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ผู้ช่วย AI
-- ---------------------------------------------------------------------------
alter table assistant_threads enable row level security;
alter table assistant_messages enable row level security;

-- จัดการห้องสนทนากับผู้ช่วย AI ของตัวเอง
create policy "assistant_threads_manage_own" on assistant_threads
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- อ่านข้อความในห้องสนทนาของตัวเอง
create policy "assistant_messages_read_own" on assistant_messages
  for select to authenticated using (owns_thread(thread_id));

-- ---------------------------------------------------------------------------
-- Analytics — เขียนได้ อ่านได้เฉพาะผู้ดูแล
-- ---------------------------------------------------------------------------
alter table analytics_events enable row level security;
alter table ai_usage_logs enable row level security;

-- บันทึก analytics event ของตัวเองได้
create policy "analytics_insert_own" on analytics_events
  for insert to authenticated
  with check (user_id is null or user_id = auth.uid());

-- อ่าน analytics ได้เฉพาะผู้ดูแลระบบ
create policy "analytics_read_admin" on analytics_events
  for select to authenticated using (auth_is_admin());

-- อ่านต้นทุน AI ได้เฉพาะผู้ดูแลระบบ
create policy "ai_usage_read_admin" on ai_usage_logs
  for select to authenticated using (auth_is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('scene-images', 'scene-images', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('scene-audio', 'scene-audio', true, 20971520, array['audio/mpeg','audio/mp4','audio/wav']),
  ('videos', 'videos', false, 524288000, array['video/mp4']),
  ('thumbnails', 'thumbnails', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('music', 'music', true, 20971520, array['audio/mpeg'])
on conflict (id) do nothing;

-- ผู้ใช้เข้าถึงได้เฉพาะโฟลเดอร์ที่ขึ้นต้นด้วย user id ของตัวเอง
-- อ่านไฟล์วิดีโอในโฟลเดอร์ของตัวเองเท่านั้น
create policy "storage_videos_read_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ลบไฟล์วิดีโอในโฟลเดอร์ของตัวเองเท่านั้น
create policy "storage_videos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
