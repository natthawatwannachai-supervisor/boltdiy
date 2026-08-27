-- =============================================================================
-- ฟังก์ชันฝั่งฐานข้อมูล: การสมัครสมาชิก เครดิต คิวงาน และรายงานผู้ดูแล
-- =============================================================================

-- ---------------------------------------------------------------------------
-- รหัสแนะนำเพื่อน
-- ---------------------------------------------------------------------------
create or replace function generate_referral_code()
returns text
language plpgsql
volatile
as $$
declare
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt integer := 0;
begin
  loop
    v_code := 'TEACH';

    for i in 1..4 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    exit when not exists (select 1 from profiles where referral_code = v_code);

    v_attempt := v_attempt + 1;

    if v_attempt > 20 then
      raise exception 'ไม่สามารถสร้างรหัสแนะนำที่ไม่ซ้ำได้';
    end if;
  end loop;

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- สมัครสมาชิกใหม่: สร้างโปรไฟล์ + กระเป๋าเครดิต + แพ็กเกจฟรี + รางวัลผู้เชิญ
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_credits integer;
  v_referral_code text;
  v_referrer_id uuid;
begin
  select monthly_credits into v_free_credits from plans where key = 'free';

  insert into profiles (id, phone, referral_code, first_name)
  values (
    new.id,
    new.phone,
    generate_referral_code(),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into credit_wallets (user_id, balance, monthly_grant)
  values (new.id, coalesce(v_free_credits, 60), coalesce(v_free_credits, 60));

  insert into subscriptions (user_id, plan) values (new.id, 'free');

  insert into credit_transactions (user_id, amount, balance_after, reason)
  values (new.id, coalesce(v_free_credits, 60), coalesce(v_free_credits, 60), 'เครดิตต้อนรับสมาชิกใหม่');

  -- ผูกความสัมพันธ์ผู้เชิญ ถ้ากรอกรหัสมาตอนสมัคร
  v_referral_code := upper(nullif(new.raw_user_meta_data ->> 'referral_code', ''));

  if v_referral_code is not null then
    select id into v_referrer_id from profiles where referral_code = v_referral_code;

    if v_referrer_id is not null and v_referrer_id <> new.id then
      update profiles set referred_by = v_referrer_id where id = new.id;

      insert into referrals (referrer_id, referred_id, code, signup_rewarded)
      values (v_referrer_id, new.id, v_referral_code, true);

      update credit_wallets
        set balance = balance + 50, updated_at = now()
        where user_id = v_referrer_id;

      insert into credit_transactions (user_id, amount, balance_after, reason)
      select v_referrer_id, 50, balance, 'เพื่อนสมัครสมาชิกด้วยรหัสของคุณ'
      from credit_wallets where user_id = v_referrer_id;

      insert into notifications (user_id, title, body, kind)
      values (v_referrer_id, '✨ คุณได้รับ 50 Credits', 'เพื่อนของคุณสมัครสมาชิกด้วยรหัสแนะนำแล้ว', 'credits');
    end if;
  end if;

  insert into notifications (user_id, title, body, kind)
  values (
    new.id,
    '🎬 ยินดีต้อนรับสู่โรงงานผลิตสื่อการสอน AI',
    'พิมพ์หัวข้อที่อยากสอน แล้วให้ AI สร้างวิดีโอพร้อมใช้ให้คุณภายในไม่กี่นาที',
    'system'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- หักเครดิต — จุดเดียวที่ยอดเครดิตลดลงได้ เรียกจาก Edge Function ก่อนเรียก AI
-- ---------------------------------------------------------------------------
create or replace function spend_credits(
  p_action text,
  p_video_id uuid default null,
  p_quantity integer default 1
)
returns table (balance integer, spent integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unit_cost integer;
  v_total integer;
  v_balance integer;
  v_label text;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  if p_quantity is null or p_quantity < 1 then
    p_quantity := 1;
  end if;

  select credits, label into v_unit_cost, v_label
  from ai_credit_costs where action = p_action;

  if v_unit_cost is null then
    raise exception 'VALIDATION_ERROR' using detail = format('ไม่รู้จักการกระทำ %s', p_action);
  end if;

  v_total := v_unit_cost * p_quantity;

  -- ล็อกแถวกันการหักซ้ำเมื่อมีหลายคำขอพร้อมกัน
  select cw.balance into v_balance
  from credit_wallets cw
  where cw.user_id = v_user_id
  for update;

  if v_balance < v_total then
    raise exception 'INSUFFICIENT_CREDITS'
      using detail = json_build_object('required', v_total, 'balance', v_balance)::text;
  end if;

  update credit_wallets
    set balance = credit_wallets.balance - v_total, updated_at = now()
    where credit_wallets.user_id = v_user_id
    returning credit_wallets.balance into v_balance;

  insert into credit_transactions (user_id, amount, balance_after, reason, action, video_id)
  values (v_user_id, -v_total, v_balance, coalesce(v_label, p_action), p_action, p_video_id);

  return query select v_balance, v_total;
end;
$$;

-- คืนเครดิตอัตโนมัติเมื่องาน AI ล้มเหลวจนหมด retry (เรียกโดย service role)
create or replace function refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_video_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update credit_wallets
    set balance = balance + p_amount, updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  insert into credit_transactions (user_id, amount, balance_after, reason, video_id)
  values (p_user_id, p_amount, v_balance, p_reason, p_video_id);

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- ใช้รหัสแนะนำหลังสมัครแล้ว (เผื่อครูลืมกรอกตอนสมัคร)
-- ---------------------------------------------------------------------------
create or replace function redeem_referral_code(p_code text)
returns table (rewarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  if exists (select 1 from referrals where referred_id = v_user_id) then
    raise exception 'VALIDATION_ERROR' using detail = 'คุณใช้รหัสแนะนำไปแล้ว';
  end if;

  select id into v_referrer_id from profiles where referral_code = upper(p_code);

  if v_referrer_id is null or v_referrer_id = v_user_id then
    raise exception 'VALIDATION_ERROR' using detail = 'ไม่พบรหัสแนะนำนี้';
  end if;

  insert into referrals (referrer_id, referred_id, code, signup_rewarded)
  values (v_referrer_id, v_user_id, upper(p_code), true);

  update profiles set referred_by = v_referrer_id where id = v_user_id;

  update credit_wallets set balance = balance + 50, updated_at = now()
    where user_id = v_referrer_id returning balance into v_balance;

  insert into credit_transactions (user_id, amount, balance_after, reason)
  values (v_referrer_id, 50, v_balance, 'เพื่อนใช้รหัสแนะนำของคุณ');

  update credit_wallets set balance = balance + 20, updated_at = now()
    where user_id = v_user_id returning balance into v_balance;

  insert into credit_transactions (user_id, amount, balance_after, reason)
  values (v_user_id, 20, v_balance, 'โบนัสจากการใช้รหัสแนะนำ');

  return query select 20;
end;
$$;

-- ---------------------------------------------------------------------------
-- จัดลำดับฉากใหม่หลังครูลากสลับตำแหน่งใน Storyboard
-- ---------------------------------------------------------------------------
create or replace function reorder_scenes(p_video_id uuid, p_scene_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cursor integer := 0;
  v_scene_id uuid;
  v_duration integer;
begin
  if not owns_video(p_video_id) then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  -- ตั้ง index ชั่วคราวเป็นค่าลบ เพื่อไม่ให้ชน unique constraint ระหว่างสลับ
  update scenes set index = -index - 1 where video_id = p_video_id;

  foreach v_scene_id in array p_scene_ids loop
    update scenes set index = v_cursor where id = v_scene_id and video_id = p_video_id;
    v_cursor := v_cursor + 1;
  end loop;

  -- คำนวณเวลาเริ่ม/จบใหม่ตามลำดับที่เปลี่ยนไป โดยรักษาความยาวเดิมของแต่ละฉาก
  v_cursor := 0;

  for v_scene_id, v_duration in
    select id, greatest(1, end_sec - start_sec) from scenes
    where video_id = p_video_id and index >= 0
    order by index
  loop
    update scenes
      set start_sec = v_cursor, end_sec = v_cursor + v_duration
      where id = v_scene_id;

    v_cursor := v_cursor + v_duration;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- ทำสำเนาโปรเจกต์ (สเปกข้อ 21) — วิดีโอที่คัดลอกมาเป็นแบบร่างพร้อมแก้
-- ---------------------------------------------------------------------------
create or replace function duplicate_project(p_project_id uuid, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_project_id uuid;
  v_video record;
  v_new_video_id uuid;
begin
  if not exists (select 1 from projects where id = p_project_id and owner_id = v_user_id) then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  insert into projects (owner_id, name, description, subject, grade_level, color)
  select owner_id, coalesce(p_name, name || ' (สำเนา)'), description, subject, grade_level, color
  from projects where id = p_project_id
  returning id into v_new_project_id;

  for v_video in select * from videos where project_id = p_project_id and owner_id = v_user_id loop
    insert into videos (
      owner_id, project_id, template_id, title, topic, grade_level, subject, duration_min,
      format, style, aspect_ratio, resolution, objectives, voice_id, voice_speed, voice_pitch,
      voice_volume, subtitle_enabled, subtitle_style, subtitle_language, subtitle_font,
      subtitle_size, music_id, status
    )
    values (
      v_video.owner_id, v_new_project_id, v_video.template_id, v_video.title || ' (สำเนา)',
      v_video.topic, v_video.grade_level, v_video.subject, v_video.duration_min, v_video.format,
      v_video.style, v_video.aspect_ratio, v_video.resolution, v_video.objectives, v_video.voice_id,
      v_video.voice_speed, v_video.voice_pitch, v_video.voice_volume, v_video.subtitle_enabled,
      v_video.subtitle_style, v_video.subtitle_language, v_video.subtitle_font, v_video.subtitle_size,
      v_video.music_id, 'draft'
    )
    returning id into v_new_video_id;

    -- คัดลอกเฉพาะบทและ prompt ไม่คัดลอกไฟล์ที่สร้างแล้ว เพื่อไม่ให้เปลืองพื้นที่
    insert into scenes (video_id, index, start_sec, end_sec, visual_description, narration, on_screen_text, transition, image_prompt)
    select v_new_video_id, index, start_sec, end_sec, visual_description, narration, on_screen_text, transition, image_prompt
    from scenes where video_id = v_video.id;
  end loop;

  return v_new_project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- บันทึกวิดีโอที่ทำเสร็จเป็นเทมเพลตไว้ใช้ซ้ำ
-- ---------------------------------------------------------------------------
create or replace function create_template_from_video(
  p_video_id uuid,
  p_title text,
  p_description text default null,
  p_is_public boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_video videos%rowtype;
  v_template_id uuid;
begin
  select * into v_video from videos where id = p_video_id and owner_id = v_user_id;

  if v_video.id is null then
    raise exception 'NOT_FOUND' using detail = 'ไม่พบวิดีโอนี้';
  end if;

  insert into templates (title, description, subject, grade_levels, format, style, duration_min, cover_url, outline, is_official, is_public, author_id)
  values (
    p_title,
    p_description,
    v_video.subject,
    array[v_video.grade_level],
    v_video.format,
    v_video.style,
    v_video.duration_min,
    v_video.thumbnail_url,
    coalesce(
      (select jsonb_agg(jsonb_build_object('title', 'Scene ' || (index + 1), 'summary', visual_description) order by index)
       from scenes where video_id = p_video_id),
      '[]'::jsonb
    ),
    false,
    p_is_public,
    v_user_id
  )
  returning id into v_template_id;

  return v_template_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- PDPA: ดาวน์โหลดข้อมูลของตัวเอง
-- ---------------------------------------------------------------------------
create or replace function export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from profiles p where p.id = v_user_id),
    'subscription', (select to_jsonb(s) from subscriptions s where s.user_id = v_user_id),
    'credit_wallet', (select to_jsonb(w) from credit_wallets w where w.user_id = v_user_id),
    'credit_transactions', coalesce((select jsonb_agg(to_jsonb(t)) from credit_transactions t where t.user_id = v_user_id), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(to_jsonb(pr)) from projects pr where pr.owner_id = v_user_id), '[]'::jsonb),
    'videos', coalesce((select jsonb_agg(to_jsonb(v)) from videos v where v.owner_id = v_user_id), '[]'::jsonb),
    'scenes', coalesce((select jsonb_agg(to_jsonb(sc)) from scenes sc join videos v on v.id = sc.video_id where v.owner_id = v_user_id), '[]'::jsonb),
    'templates', coalesce((select jsonb_agg(to_jsonb(tp)) from templates tp where tp.author_id = v_user_id), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- คิวงาน: หยิบงานถัดไปแบบกันชนกันหลาย worker
-- ---------------------------------------------------------------------------
create or replace function claim_next_job()
returns jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
begin
  update jobs
    set status = 'running',
        attempts = attempts + 1,
        started_at = now()
    where id = (
      select j.id
      from jobs j
      where j.status = 'queued'
        and j.scheduled_at <= now()
        -- หยิบได้ก็ต่อเมื่อไม่มีขั้นก่อนหน้าของวิดีโอเดียวกันค้างอยู่
        -- ป้องกันไม่ให้ขั้นถัดไปแซงขึ้นมาทำงานตอนที่ขั้นก่อนหน้ากำลัง retry
        and not exists (
          select 1 from jobs prior
          where prior.video_id = j.video_id
            and prior.id <> j.id
            and prior.status in ('queued', 'running')
            and (prior.sequence < j.sequence
                 or (prior.sequence = j.sequence and prior.created_at < j.created_at))
        )
      order by j.scheduled_at, j.sequence
      for update skip locked
      limit 1
    )
    returning * into v_job;

  return v_job;
end;
$$;

revoke execute on function claim_next_job() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- รายงานสำหรับผู้ดูแล (สเปกข้อ 28–29)
-- ---------------------------------------------------------------------------
create or replace view admin_overview
with (security_invoker = true)
as
select
  (select count(*) from profiles)::int as total_users,
  (select count(*) from profiles where last_active_at > now() - interval '30 days')::int as active_users_30d,
  (select count(*) from subscriptions where plan = 'free')::int as free_users,
  (select count(*) from subscriptions where plan <> 'free' and status = 'active')::int as paid_users,
  coalesce((
    select sum(p.price_thb) from subscriptions s
    join plans p on p.key = s.plan
    where s.status = 'active' and s.plan <> 'free'
  ), 0)::int as mrr_thb,
  (select count(*) from videos)::int as videos_total,
  (select count(*) from videos where created_at > now() - interval '30 days')::int as videos_30d,
  coalesce((
    select -sum(amount) from credit_transactions
    where amount < 0 and created_at > now() - interval '30 days'
  ), 0)::int as credits_spent_30d,
  coalesce((
    select sum(cost_thb) from ai_usage_logs where created_at > now() - interval '30 days'
  ), 0)::numeric(12,2) as ai_cost_thb_30d,
  case
    when (select count(*) from profiles) = 0 then 0
    else round(
      (select count(*) from subscriptions where plan <> 'free' and status = 'active')::numeric
      / nullif((select count(*) from profiles)::numeric, 0) * 100, 2)
  end as conversion_rate,
  case
    when (select count(*) from subscriptions where first_paid_at is not null) = 0 then 0
    else round(
      (select count(*) from subscriptions where cancelled_at > now() - interval '30 days')::numeric
      / nullif((select count(*) from subscriptions where first_paid_at is not null)::numeric, 0) * 100, 2)
  end as churn_rate;

create or replace view admin_daily_stats
with (security_invoker = true)
as
with days as (
  select generate_series(current_date - interval '29 days', current_date, interval '1 day')::date as day
)
select
  d.day::text as day,
  (select count(*) from profiles p where p.created_at::date = d.day)::int as signups,
  (select count(*) from videos v where v.created_at::date = d.day)::int as videos_created,
  coalesce((select sum(amount_thb) from payments pay where pay.status = 'paid' and pay.paid_at::date = d.day), 0)::int as revenue_thb,
  coalesce((select -sum(amount) from credit_transactions ct where ct.amount < 0 and ct.created_at::date = d.day), 0)::int as credits_spent
from days d
order by d.day;

-- Template ยอดนิยมและฟีเจอร์ที่ถูกใช้มากที่สุด (สำหรับหน้า Analytics ของผู้ดูแล)
-- ผู้ดูแลเท่านั้นที่เรียกได้ ตรวจซ้ำในตัวฟังก์ชันเพราะเป็น security definer
create or replace function usage_insights()
returns table ("group" text, label text, value integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not auth_is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  return query
    select 'Template ยอดนิยม'::text, t.title, t.usage_count
    from templates t
    where t.usage_count > 0
    order by t.usage_count desc
    limit 5;

  return query
    select 'ฟีเจอร์ที่ใช้มากที่สุด'::text, ae.event, count(*)::int
    from analytics_events ae
    where ae.created_at > now() - interval '30 days'
    group by ae.event
    order by 3 desc
    limit 8;

  return query
    select 'วิชายอดนิยม'::text, v.subject::text, count(*)::int
    from videos v
    group by v.subject
    order by 3 desc
    limit 5;
end;
$$;

revoke execute on function usage_insights() from anon;

-- ---------------------------------------------------------------------------
-- หักเครดิตแทนผู้ใช้ (ใช้โดย worker เบื้องหลังที่ไม่มี auth.uid())
-- ให้สิทธิ์เฉพาะ service role เท่านั้น
-- ---------------------------------------------------------------------------
create or replace function spend_credits_for(
  p_user_id uuid,
  p_action text,
  p_video_id uuid default null,
  p_quantity integer default 1
)
returns table (balance integer, spent integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_cost integer;
  v_total integer;
  v_balance integer;
  v_label text;
begin
  if p_quantity is null or p_quantity < 1 then
    p_quantity := 1;
  end if;

  select credits, label into v_unit_cost, v_label
  from ai_credit_costs where action = p_action;

  if v_unit_cost is null then
    raise exception 'VALIDATION_ERROR' using detail = format('ไม่รู้จักการกระทำ %s', p_action);
  end if;

  v_total := v_unit_cost * p_quantity;

  select cw.balance into v_balance
  from credit_wallets cw
  where cw.user_id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'NOT_FOUND' using detail = 'ไม่พบกระเป๋าเครดิตของผู้ใช้';
  end if;

  if v_balance < v_total then
    raise exception 'INSUFFICIENT_CREDITS'
      using detail = json_build_object('required', v_total, 'balance', v_balance)::text;
  end if;

  update credit_wallets
    set balance = credit_wallets.balance - v_total, updated_at = now()
    where credit_wallets.user_id = p_user_id
    returning credit_wallets.balance into v_balance;

  insert into credit_transactions (user_id, amount, balance_after, reason, action, video_id)
  values (p_user_id, -v_total, v_balance, coalesce(v_label, p_action), p_action, p_video_id);

  return query select v_balance, v_total;
end;
$$;

revoke execute on function spend_credits_for(uuid, text, uuid, integer) from anon, authenticated;
