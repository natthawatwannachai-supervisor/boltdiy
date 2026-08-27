-- =============================================================================
-- งานตามเวลา: เดินคิวงาน AI และรีเซ็ตโควตารายเดือน
-- =============================================================================

-- ---------------------------------------------------------------------------
-- นับจำนวนครั้งที่เทมเพลตถูกใช้ (เรียกจาก Edge Function ตอนสร้างวิดีโอ)
-- ---------------------------------------------------------------------------
create or replace function increment_template_usage(p_template_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update templates set usage_count = usage_count + 1 where id = p_template_id;
$$;

-- ---------------------------------------------------------------------------
-- รีเซ็ตโควตาวิดีโอและเติมเครดิตรายเดือนเมื่อครบรอบบิล
-- ---------------------------------------------------------------------------
create or replace function reset_monthly_quotas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
  v_balance integer;
begin
  for v_row in
    select s.user_id, s.plan, s.cancel_at_period_end, p.monthly_credits, p.name
    from subscriptions s
    join plans p on p.key = s.plan
    where s.current_period_end <= now() and s.status = 'active'
  loop
    -- ยกเลิกไว้แล้วให้ตกกลับไปแพ็กเกจฟรีเมื่อจบรอบ
    if v_row.cancel_at_period_end and v_row.plan <> 'free' then
      update subscriptions set
        plan = 'free',
        cancel_at_period_end = false,
        cancelled_at = now(),
        videos_used_this_period = 0,
        current_period_start = now(),
        current_period_end = now() + interval '30 days'
      where user_id = v_row.user_id;

      insert into notifications (user_id, title, body, kind)
      values (v_row.user_id, 'แพ็กเกจของคุณสิ้นสุดแล้ว',
              'บัญชีกลับไปใช้แพ็กเกจ FREE คุณสมัครใหม่ได้ทุกเมื่อ', 'system');
    else
      update subscriptions set
        videos_used_this_period = 0,
        current_period_start = now(),
        current_period_end = now() + interval '30 days'
      where user_id = v_row.user_id;

      update credit_wallets set
        balance = balance + v_row.monthly_credits,
        monthly_grant = v_row.monthly_credits,
        updated_at = now()
      where user_id = v_row.user_id
      returning balance into v_balance;

      if v_row.monthly_credits > 0 then
        insert into credit_transactions (user_id, amount, balance_after, reason)
        values (v_row.user_id, v_row.monthly_credits, v_balance,
                format('เครดิตรายเดือนจากแพ็กเกจ %s', v_row.name));
      end if;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function reset_monthly_quotas() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- ล้างไฟล์พรีวิวเสียงที่ค้างเกิน 7 วัน เพื่อไม่ให้ Storage บวม
-- ---------------------------------------------------------------------------
create or replace function purge_stale_previews()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with removed as (
    delete from assets
    where video_id is null
      and storage_path like '%/previews/%'
      and created_at < now() - interval '7 days'
    returning 1
  )
  select count(*) into v_count from removed;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- ตั้งเวลาเรียก job-worker
--
-- ต้องเปิด extension pg_cron และ pg_net ใน Supabase Dashboard ก่อน
-- แล้วเก็บความลับไว้ใน Vault:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co', 'functions_base_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
--   select vault.create_secret('<JOB_WORKER_SECRET>', 'job_worker_secret');
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function kick_job_worker()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_base_url text;
  v_service_key text;
  v_worker_secret text;
begin
  select decrypted_secret into v_base_url from vault.decrypted_secrets where name = 'functions_base_url';
  select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'service_role_key';
  select decrypted_secret into v_worker_secret from vault.decrypted_secrets where name = 'job_worker_secret';

  if v_base_url is null or v_service_key is null then
    raise notice 'ยังไม่ได้ตั้งค่า secret สำหรับเรียก job-worker';
    return;
  end if;

  perform net.http_post(
    url := v_base_url || '/job-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key,
      'x-worker-secret', coalesce(v_worker_secret, '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

-- เดินคิวงานทุกนาที เพื่อให้ครูเห็นความคืบหน้าเกือบเรียลไทม์
select cron.schedule('tvf-job-worker', '* * * * *', $$select kick_job_worker();$$);

-- ตรวจรอบบิลวันละครั้ง (07:00 น. เวลาไทย = 00:00 UTC)
select cron.schedule('tvf-monthly-reset', '0 0 * * *', $$select reset_monthly_quotas();$$);

-- เก็บกวาดไฟล์พรีวิวสัปดาห์ละครั้ง
select cron.schedule('tvf-purge-previews', '30 1 * * 0', $$select purge_stale_previews();$$);
