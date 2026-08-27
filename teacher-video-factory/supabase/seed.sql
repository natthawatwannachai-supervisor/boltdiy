-- =============================================================================
-- Seed data สำหรับการพัฒนาและสาธิต
-- รันอัตโนมัติด้วย `supabase db reset`
-- =============================================================================

-- ---------------------------------------------------------------------------
-- แพ็กเกจ (สเปกข้อ 25)
-- ---------------------------------------------------------------------------
insert into plans (key, name, price_thb, videos_per_month, max_duration_min, max_resolution, watermark, monthly_credits, seats, features) values
  ('free', 'FREE', 0, 3, 3, '720p', true, 60, 1,
   '["3 วิดีโอ/เดือน","ความยาวสูงสุด 3 นาที","ความละเอียด 720p","มีลายน้ำ","เครดิต AI จำกัด"]'::jsonb),
  ('teacher', 'TEACHER', 199, 20, 10, '1080p', false, 400, 1,
   '["20 วิดีโอ/เดือน","ความละเอียด 1080p","ไม่มีลายน้ำ","เสียงบรรยาย AI","Subtitle อัตโนมัติ","Thumbnail AI"]'::jsonb),
  ('pro_teacher', 'PRO TEACHER', 399, 50, 15, '1080p', false, 1000, 1,
   '["50 วิดีโอ/เดือน","ความละเอียด 1080p","AI Voice Premium","AI Image คุณภาพสูง","AI สร้างแบบทดสอบ","ชุดสื่อการสอนครบชุด","ส่งออกเข้า Google Classroom"]'::jsonb),
  ('school', 'SCHOOL', 999, 300, 15, '1080p', false, 6000, 10,
   '["ใช้งานได้ 10 ครู","300 วิดีโอ/เดือน","Template ใช้ร่วมกันทั้งโรงเรียน","Dashboard ผู้ดูแล","รายงานการใช้งาน","ใส่โลโก้โรงเรียนบนวิดีโอ"]'::jsonb)
on conflict (key) do update set
  name = excluded.name,
  price_thb = excluded.price_thb,
  videos_per_month = excluded.videos_per_month,
  max_duration_min = excluded.max_duration_min,
  max_resolution = excluded.max_resolution,
  watermark = excluded.watermark,
  monthly_credits = excluded.monthly_credits,
  seats = excluded.seats,
  features = excluded.features;

-- ---------------------------------------------------------------------------
-- อัตราการใช้เครดิต (สเปกข้อ 26) — ต้องตรงกับ src/constants/billing.ts
-- ---------------------------------------------------------------------------
insert into ai_credit_costs (action, credits, label) values
  ('analyze', 1, 'วิเคราะห์หัวข้อ'),
  ('objectives', 1, 'สร้างวัตถุประสงค์การเรียนรู้'),
  ('script', 1, 'สร้างบทวิดีโอ'),
  ('storyboard', 1, 'สร้าง Storyboard'),
  ('image', 2, 'สร้างภาพประกอบ'),
  ('voice', 2, 'สร้างเสียงบรรยาย'),
  ('subtitles', 1, 'สร้าง Subtitle'),
  ('render', 5, 'ประกอบเป็นวิดีโอ'),
  ('quality', 1, 'ตรวจสอบคุณภาพ'),
  ('thumbnail', 2, 'สร้าง Thumbnail'),
  ('assistant', 1, 'ถามน้อง Teacher AI'),
  ('lesson_kit', 10, 'สร้างชุดสื่อการสอนครบชุด')
on conflict (action) do update set credits = excluded.credits, label = excluded.label;

insert into credit_packs (id, credits, price_thb, bonus_label) values
  ('pack-100', 100, 99, null),
  ('pack-300', 300, 249, 'คุ้มกว่า 16%'),
  ('pack-1000', 1000, 699, 'คุ้มที่สุด 30%')
on conflict (id) do update set credits = excluded.credits, price_thb = excluded.price_thb;

-- ---------------------------------------------------------------------------
-- เสียงบรรยาย (สเปกข้อ 13) — provider_voice ทำให้สลับผู้ให้บริการ TTS ได้
-- ---------------------------------------------------------------------------
insert into voices (id, label, gender, tone, language, provider_voice, premium, sort_order) values
  ('th-male-teacher', 'ครูชาย มืออาชีพ', 'male', 'professional', 'th', '{"google":"th-TH-Neural2-C","openai":"onyx"}'::jsonb, false, 1),
  ('th-male-warm', 'ครูชาย อบอุ่น', 'male', 'warm', 'th', '{"google":"th-TH-Standard-B","openai":"echo"}'::jsonb, false, 2),
  ('th-male-playful', 'ครูชาย สนุกสนาน', 'male', 'playful', 'th', '{"google":"th-TH-Standard-D","openai":"fable"}'::jsonb, false, 3),
  ('th-male-serious', 'ครูชาย จริงจัง', 'male', 'serious', 'th', '{"google":"th-TH-Neural2-D","openai":"onyx"}'::jsonb, true, 4),
  ('th-male-doc', 'ผู้บรรยายสารคดี (ชาย)', 'male', 'documentary', 'th', '{"google":"th-TH-Neural2-B","openai":"onyx"}'::jsonb, true, 5),
  ('th-female-teacher', 'ครูหญิง มืออาชีพ', 'female', 'professional', 'th', '{"google":"th-TH-Neural2-A","openai":"nova"}'::jsonb, false, 6),
  ('th-female-warm', 'ครูหญิง อบอุ่น', 'female', 'warm', 'th', '{"google":"th-TH-Standard-A","openai":"shimmer"}'::jsonb, false, 7),
  ('th-female-bright', 'ครูหญิง สดใส', 'female', 'cheerful', 'th', '{"google":"th-TH-Standard-C","openai":"nova"}'::jsonb, false, 8),
  ('th-female-playful', 'ครูหญิง สนุกสนาน', 'female', 'playful', 'th', '{"google":"th-TH-Neural2-E","openai":"shimmer"}'::jsonb, true, 9),
  ('th-female-doc', 'ผู้บรรยายสารคดี (หญิง)', 'female', 'documentary', 'th', '{"google":"th-TH-Neural2-F","openai":"alloy"}'::jsonb, true, 10)
on conflict (id) do update set label = excluded.label, provider_voice = excluded.provider_voice;

-- ---------------------------------------------------------------------------
-- เพลงประกอบ — ทุกแทร็กต้องใช้เชิงพาณิชย์ได้ (สเปกข้อ 16)
-- ---------------------------------------------------------------------------
insert into music_tracks (id, label, mood, license, attribution, storage_path) values
  ('fun-01', 'สนุกสนาน', 'fun', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Kevin MacLeod / incompetech (CC0)', 'music/fun-01.mp3'),
  ('calm-01', 'ผ่อนคลาย', 'calm', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/calm-01.mp3'),
  ('science-01', 'วิทยาศาสตร์', 'science', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/science-01.mp3'),
  ('adventure-01', 'Adventure', 'adventure', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/adventure-01.mp3'),
  ('emotional-01', 'Emotional', 'emotional', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/emotional-01.mp3'),
  ('corporate-01', 'Corporate', 'corporate', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/corporate-01.mp3'),
  ('kids-01', 'Kids', 'kids', 'CC0 1.0 Universal — ใช้เชิงพาณิชย์ได้', 'Free Music Archive (CC0)', 'music/kids-01.mp3')
on conflict (id) do update set label = excluded.label, license = excluded.license;

-- ---------------------------------------------------------------------------
-- เทมเพลตทางการ (สเปกข้อ 22)
-- ---------------------------------------------------------------------------
insert into templates (title, description, subject, grade_levels, format, style, duration_min, outline, is_official, is_public, usage_count) values
  ('ระบบสุริยะ', 'พาเด็ก ๆ ทัวร์ดาวเคราะห์ทั้ง 8 ดวง พร้อมเปรียบเทียบขนาดและระยะทาง', 'science', array['p4','p5','p6']::grade_level[], 'lesson', 'three_d', 5,
   '[{"title":"เปิดเรื่อง","summary":"ตั้งคำถามว่าโลกของเราอยู่ตรงไหนในจักรวาล"},{"title":"ดวงอาทิตย์","summary":"ศูนย์กลางของระบบสุริยะ"},{"title":"ดาวเคราะห์ชั้นใน","summary":"พุธ ศุกร์ โลก อังคาร"},{"title":"ดาวเคราะห์ชั้นนอก","summary":"พฤหัสบดี เสาร์ ยูเรนัส เนปจูน"},{"title":"สรุป","summary":"ทบทวนลำดับดาวเคราะห์"}]'::jsonb,
   true, true, 428),
  ('วัฏจักรน้ำ', 'อธิบายการระเหย การควบแน่น และการตกของฝนอย่างเป็นลำดับ', 'science', array['p4','p5']::grade_level[], 'concept', 'infographic', 5,
   '[{"title":"น้ำอยู่ที่ไหนบ้าง","summary":"แหล่งน้ำรอบตัวเรา"},{"title":"การระเหย","summary":"ความร้อนทำให้น้ำกลายเป็นไอ"},{"title":"การควบแน่น","summary":"ไอน้ำรวมตัวเป็นเมฆ"},{"title":"การตกของฝน","summary":"หยดน้ำตกกลับสู่พื้นดิน"},{"title":"หมุนเวียนไม่สิ้นสุด","summary":"สรุปวัฏจักร"}]'::jsonb,
   true, true, 356),
  ('การเกิดฝน', 'เชื่อมโยงการเกิดฝนกับวัฏจักรน้ำและปัจจัยทางอากาศ', 'science', array['p5','p6']::grade_level[], 'lesson', 'animation', 5,
   '[{"title":"ฝนเกิดขึ้นได้อย่างไร","summary":"ตั้งคำถามชวนสงสัย"},{"title":"ไอน้ำและเมฆ","summary":"ความชื้นในอากาศ"},{"title":"ปัจจัยที่ทำให้ฝนตก","summary":"อุณหภูมิและความกดอากาศ"},{"title":"ประโยชน์ของฝน","summary":"ต่อการเกษตรและชีวิตประจำวัน"}]'::jsonb,
   true, true, 512),
  ('แรงและการเคลื่อนที่', 'แรงผลัก แรงดึง และแรงเสียดทานในชีวิตประจำวัน', 'science', array['p4','p5','p6']::grade_level[], 'experiment', 'cartoon', 5,
   '[{"title":"แรงคืออะไร","summary":"นิยามและตัวอย่างใกล้ตัว"},{"title":"แรงผลักและแรงดึง","summary":"สาธิตด้วยของเล่น"},{"title":"แรงเสียดทาน","summary":"ทดลองกับพื้นผิวต่างกัน"},{"title":"สรุปและกิจกรรม","summary":"คำถามท้ายคลิป"}]'::jsonb,
   true, true, 289),
  ('คำราชาศัพท์', 'จำแนกคำราชาศัพท์ตามหมวดและฝึกใช้ให้ถูกบริบท', 'thai', array['m1','m2','m3']::grade_level[], 'lesson', 'minimal', 5,
   '[{"title":"ทำไมต้องมีคำราชาศัพท์","summary":"ที่มาและความสำคัญ"},{"title":"หมวดร่างกาย","summary":"พระเนตร พระหัตถ์ พระบาท"},{"title":"หมวดกริยา","summary":"เสด็จ ประทับ ทรง"},{"title":"ฝึกใช้ในประโยค","summary":"ตัวอย่างและแบบฝึก"}]'::jsonb,
   true, true, 203),
  ('การอ่านจับใจความ', 'เทคนิคหาใจความสำคัญและใจความรองจากบทอ่าน', 'thai', array['p5','p6','m1']::grade_level[], 'concept', 'whiteboard', 5,
   '[{"title":"ใจความสำคัญคืออะไร","summary":"แยกใจความสำคัญกับรายละเอียด"},{"title":"เทคนิคอ่านเร็ว","summary":"กวาดสายตาหาคำสำคัญ"},{"title":"ฝึกจากบทอ่านจริง","summary":"ทีละย่อหน้า"},{"title":"สรุปเป็นประโยคเดียว","summary":"แบบฝึกท้ายคลิป"}]'::jsonb,
   true, true, 176),
  ('ชนิดของคำ', 'คำนาม คำสรรพนาม คำกริยา คำวิเศษณ์ พร้อมตัวอย่าง', 'thai', array['p4','p5','p6']::grade_level[], 'lesson', 'infographic', 5,
   '[{"title":"คำในภาษาไทยมีกี่ชนิด","summary":"ภาพรวม 7 ชนิด"},{"title":"คำนามและคำสรรพนาม","summary":"ใช้แทนสิ่งต่าง ๆ"},{"title":"คำกริยา","summary":"แสดงอาการ"},{"title":"คำวิเศษณ์","summary":"ขยายความ"},{"title":"แบบฝึก","summary":"ชี้ชนิดของคำในประโยค"}]'::jsonb,
   true, true, 241),
  ('เศษส่วน', 'ความหมายของเศษส่วน การเปรียบเทียบ และการบวกลบเบื้องต้น', 'math', array['p4','p5']::grade_level[], 'concept', 'cartoon', 5,
   '[{"title":"เศษส่วนคืออะไร","summary":"แบ่งพิซซ่าให้เข้าใจง่าย"},{"title":"เศษส่วนที่เท่ากัน","summary":"ขยายและทอนส่วน"},{"title":"เปรียบเทียบเศษส่วน","summary":"ตัวส่วนเท่ากันและไม่เท่ากัน"},{"title":"บวกลบเศษส่วน","summary":"ตัวอย่างทีละขั้น"}]'::jsonb,
   true, true, 467),
  ('สมการ', 'แก้สมการเชิงเส้นตัวแปรเดียวอย่างเป็นระบบ', 'math', array['m1','m2']::grade_level[], 'lesson', 'whiteboard', 5,
   '[{"title":"สมการคืออะไร","summary":"เปรียบกับตาชั่งสองข้าง"},{"title":"สมบัติการเท่ากัน","summary":"ทำอะไรข้างหนึ่ง ต้องทำอีกข้าง"},{"title":"แก้สมการทีละขั้น","summary":"ตัวอย่าง 3 ข้อ"},{"title":"โจทย์ปัญหา","summary":"แปลงประโยคเป็นสมการ"}]'::jsonb,
   true, true, 318),
  ('พื้นที่', 'สูตรหาพื้นที่รูปสี่เหลี่ยม สามเหลี่ยม และวงกลม', 'math', array['p5','p6','m1']::grade_level[], 'lesson', 'infographic', 5,
   '[{"title":"พื้นที่คืออะไร","summary":"นับตารางหน่วย"},{"title":"สี่เหลี่ยม","summary":"กว้าง x ยาว"},{"title":"สามเหลี่ยม","summary":"ครึ่งหนึ่งของสี่เหลี่ยม"},{"title":"วงกลม","summary":"พาย r กำลังสอง"}]'::jsonb,
   true, true, 254),
  ('ร้อยละ', 'ความหมายของร้อยละและการนำไปใช้ในชีวิตจริง', 'math', array['p5','p6']::grade_level[], 'micro', 'minimal', 3,
   '[{"title":"ร้อยละคืออะไร","summary":"เทียบจาก 100 ส่วน"},{"title":"แปลงเศษส่วนเป็นร้อยละ","summary":"วิธีคิดอย่างง่าย"},{"title":"ส่วนลดในห้าง","summary":"ตัวอย่างใกล้ตัว"}]'::jsonb,
   true, true, 198),
  ('การสังเคราะห์แสง', 'กระบวนการที่พืชสร้างอาหารจากแสงอาทิตย์', 'science', array['p6','m1']::grade_level[], 'concept', 'three_d', 5,
   '[{"title":"พืชกินอะไร","summary":"ตั้งคำถามชวนคิด"},{"title":"วัตถุดิบ","summary":"แสง น้ำ คาร์บอนไดออกไซด์"},{"title":"ในใบไม้เกิดอะไรขึ้น","summary":"คลอโรฟิลล์และคลอโรพลาสต์"},{"title":"ผลลัพธ์","summary":"น้ำตาลและออกซิเจน"},{"title":"ความสำคัญ","summary":"ต่อสิ่งมีชีวิตทั้งโลก"}]'::jsonb,
   true, true, 389)
on conflict do nothing;

-- =============================================================================
-- บัญชีสาธิต (สเปกข้อ 41)
--   ครู : teacher@demo.tvfactory.co.th / Demo1234!
--   แอดมิน: admin@demo.tvfactory.co.th / Admin1234!
-- ใช้เฉพาะฐานข้อมูลสำหรับพัฒนา/สาธิตเท่านั้น อย่ารันไฟล์นี้กับ production
-- =============================================================================
do $$
declare
  v_teacher_id uuid := '11111111-1111-4111-8111-111111111111';
  v_admin_id uuid := '22222222-2222-4222-8222-222222222222';
  v_project_id uuid := '33333333-3333-4333-8333-333333333333';
  v_video_id uuid := '44444444-4444-4444-8444-444444444444';
  v_draft_id uuid := '55555555-5555-4555-8555-555555555555';
  v_working_id uuid := '66666666-6666-4666-8666-666666666666';
  v_narrations text[] := array[
    'เคยสงสัยไหมครับว่า ฝนที่ตกลงมาจากท้องฟ้าเกิดขึ้นได้อย่างไร วันนี้เราจะไปหาคำตอบกัน',
    'ทุกวันแสงแดดทำให้น้ำในแม่น้ำ ทะเล และแหล่งน้ำต่าง ๆ ระเหยกลายเป็นไอน้ำลอยขึ้นสู่ท้องฟ้า',
    'เมื่อไอน้ำลอยสูงขึ้น อากาศเย็นลง ไอน้ำจึงควบแน่นเกาะรวมกันเป็นละอองน้ำเล็ก ๆ กลายเป็นเมฆ',
    'ละอองน้ำในเมฆชนกันและรวมตัวใหญ่ขึ้นเรื่อย ๆ จนหนักเกินกว่าที่อากาศจะพยุงไว้ได้',
    'เมื่อหยดน้ำหนักพอ ก็จะตกลงมาเป็นฝน แล้วไหลกลับสู่แหล่งน้ำ เริ่มวัฏจักรใหม่อีกครั้ง',
    'ฝนจึงไม่ได้เกิดขึ้นลอย ๆ แต่เป็นส่วนหนึ่งของวัฏจักรน้ำที่หมุนเวียนไม่สิ้นสุด'
  ];
  v_visuals text[] := array[
    'เมฆบนท้องฟ้าและหยดน้ำกำลังตกลงมา',
    'ดวงอาทิตย์ส่องแสงเหนือทะเล มีลูกศรไอน้ำลอยขึ้น',
    'ไอน้ำควบแน่นเป็นละอองน้ำรวมกันเป็นก้อนเมฆ',
    'ละอองน้ำในเมฆชนกันจนหยดใหญ่ขึ้น',
    'ฝนตกลงสู่แม่น้ำและพื้นดิน',
    'แผนภาพวัฏจักรน้ำครบวงจรพร้อมลูกศร'
  ];
  v_texts text[] := array[
    'ฝนเกิดขึ้นได้อย่างไร?',
    'ขั้นที่ 1 การระเหย',
    'ขั้นที่ 2 การควบแน่น',
    'ขั้นที่ 3 หยดน้ำรวมตัว',
    'ขั้นที่ 4 การตกของฝน',
    'วัฏจักรน้ำ'
  ];
  i integer;
begin
  if exists (select 1 from auth.users where id = v_teacher_id) then
    return;
  end if;

  -- --- ผู้ใช้สาธิต --------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    ('00000000-0000-0000-0000-000000000000', v_teacher_id, 'authenticated', 'authenticated',
     'teacher@demo.tvfactory.co.th', crypt('Demo1234!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"สมชาย ใจดี"}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
     'admin@demo.tvfactory.co.th', crypt('Admin1234!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"ผู้ดูแลระบบ"}'::jsonb, now(), now());

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (v_teacher_id::text, v_teacher_id,
     format('{"sub":"%s","email":"teacher@demo.tvfactory.co.th","email_verified":true}', v_teacher_id)::jsonb,
     'email', now(), now(), now()),
    (v_admin_id::text, v_admin_id,
     format('{"sub":"%s","email":"admin@demo.tvfactory.co.th","email_verified":true}', v_admin_id)::jsonb,
     'email', now(), now(), now());

  -- trigger handle_new_user สร้างโปรไฟล์/กระเป๋าเครดิตให้แล้ว เติมรายละเอียดต่อ
  update profiles set
    first_name = 'สมชาย',
    last_name = 'ใจดี',
    position = 'ครูชำนาญการ',
    school = 'โรงเรียนบ้านหนองบัว',
    affiliation = 'สพป.ขอนแก่น เขต 1',
    education_stage = 'primary',
    grade_levels = array['p4','p5','p6']::grade_level[],
    subjects = array['science','math']::subject_key[],
    referral_code = 'TEACHDEMO',
    onboarded_at = now()
  where id = v_teacher_id;

  update profiles set
    first_name = 'ผู้ดูแล',
    last_name = 'ระบบ',
    position = 'Admin',
    role = 'admin',
    referral_code = 'ADMINDEMO',
    onboarded_at = now()
  where id = v_admin_id;

  update subscriptions set plan = 'pro_teacher', first_paid_at = now() - interval '40 days'
    where user_id = v_teacher_id;

  update credit_wallets set balance = 850, monthly_grant = 1000 where user_id = v_teacher_id;
  update credit_wallets set balance = 9999, monthly_grant = 6000 where user_id = v_admin_id;

  -- --- โปรเจกต์และวิดีโอตัวอย่าง -----------------------------------------
  insert into projects (id, owner_id, name, description, subject, grade_level, color)
  values (v_project_id, v_teacher_id, 'วิทยาศาสตร์ ป.5', 'หน่วยการเรียนรู้เรื่องน้ำและอากาศ', 'science', 'p5', '#1D4ED8');

  insert into videos (
    id, owner_id, project_id, title, topic, grade_level, subject, duration_min, format, style,
    resolution, objectives, voice_id, music_id, status, progress, video_url, thumbnail_url,
    watermarked, quality_score, completed_at
  ) values (
    v_video_id, v_teacher_id, v_project_id, 'การเกิดฝน', 'การเกิดฝน', 'p5', 'science', 5, 'lesson', 'animation',
    '1080p',
    '[{"id":"obj-1","text":"นักเรียนสามารถอธิบายกระบวนการเกิดฝนได้","bloom":"understand"},
      {"id":"obj-2","text":"นักเรียนสามารถบอกปัจจัยที่เกี่ยวข้องกับการเกิดฝนได้","bloom":"remember"},
      {"id":"obj-3","text":"นักเรียนสามารถเชื่อมโยงการเกิดฝนกับวัฏจักรน้ำได้","bloom":"analyze"}]'::jsonb,
    'th-female-teacher', 'science-01', 'completed', 100,
    'https://cdn.tvfactory.co.th/demo/kan-kerd-fon.mp4',
    'https://cdn.tvfactory.co.th/demo/kan-kerd-fon.jpg',
    false, 92, now() - interval '2 days'
  );

  for i in 1..6 loop
    insert into scenes (
      video_id, index, start_sec, end_sec, visual_description, narration, on_screen_text,
      transition, image_prompt, image_url, image_status, audio_url, audio_status
    ) values (
      v_video_id, i - 1, (i - 1) * 50, i * 50,
      v_visuals[i], v_narrations[i], v_texts[i],
      case when i = 6 then 'fade' else 'crossfade' end,
      format('Educational 3D illustration for Thai primary school science lesson: %s, colorful, child-friendly, scientifically accurate, clean background, no text', v_visuals[i]),
      format('https://cdn.tvfactory.co.th/demo/scene-%s.jpg', i),
      'ready',
      format('https://cdn.tvfactory.co.th/demo/scene-%s.mp3', i),
      'ready'
    );
  end loop;

  insert into subtitle_cues (video_id, index, start_sec, end_sec, text_th, keywords)
  select v_video_id, index, start_sec, end_sec, narration,
         case when index = 1 then array['การระเหย'] when index = 2 then array['การควบแน่น'] else '{}'::text[] end
  from scenes where video_id = v_video_id;

  insert into scripts (video_id, version, hook, summary, full_text, model)
  values (
    v_video_id, 1,
    'เคยสงสัยไหมครับว่า ฝนที่ตกลงมาจากท้องฟ้าเกิดขึ้นได้อย่างไร',
    'อธิบายการเกิดฝนผ่าน 4 ขั้นของวัฏจักรน้ำ สำหรับนักเรียนชั้น ป.5 ความยาว 5 นาที',
    array_to_string(v_narrations, E'\n\n'),
    'demo-seed'
  );

  insert into quality_reports (video_id, score, report) values (
    v_video_id, 92,
    '{"score":92,"checks":[
      {"key":"content","label":"เนื้อหา","passed":true,"detail":"สอดคล้องกับระดับชั้น ป.5 ใช้คำศัพท์ที่นักเรียนเข้าใจได้"},
      {"key":"script","label":"Script","passed":true,"detail":"ความยาวรวม 5 นาที ตรงกับที่กำหนด"},
      {"key":"visual","label":"Visual","passed":true,"detail":"มีภาพประกอบครบทั้ง 6 ฉาก"},
      {"key":"audio","label":"Audio","passed":true,"detail":"มีเสียงบรรยายครบทุกฉาก"},
      {"key":"subtitle","label":"Subtitle","passed":true,"detail":"มี Subtitle ภาษาไทยครบทุกช่วงเวลา"},
      {"key":"objective","label":"Learning Objective","passed":true,"detail":"ครอบคลุมวัตถุประสงค์ทั้ง 3 ข้อ"}
    ],
    "suggestions":["แนะนำให้เพิ่มตัวอย่างใน Scene 4 เพื่อช่วยให้นักเรียนเข้าใจแนวคิดได้ง่ายขึ้น","อาจเพิ่มคำถามท้ายคลิปเพื่อตรวจสอบความเข้าใจ"]}'::jsonb
  );

  -- วิดีโอที่กำลังสร้าง (ใช้ทดสอบหน้าจอ progress และการแจ้งเตือน)
  insert into videos (id, owner_id, project_id, title, topic, grade_level, subject, duration_min, format, style, status, progress, voice_id)
  values (v_working_id, v_teacher_id, v_project_id, 'วัฏจักรน้ำ', 'วัฏจักรน้ำ', 'p5', 'science', 5, 'concept', 'infographic', 'generating_images', 42, 'th-female-warm');

  insert into scenes (video_id, index, start_sec, end_sec, visual_description, narration, on_screen_text, image_status, audio_status)
  values
    (v_working_id, 0, 0, 25, 'แหล่งน้ำรอบตัวเรา', 'น้ำอยู่รอบตัวเราทุกที่ ทั้งในแม่น้ำ ทะเล และในอากาศ', 'น้ำอยู่ที่ไหนบ้าง', 'ready', 'pending'),
    (v_working_id, 1, 25, 50, 'แสงแดดทำให้น้ำระเหย', 'ความร้อนจากดวงอาทิตย์ทำให้น้ำกลายเป็นไอ', 'การระเหย', 'generating', 'pending'),
    (v_working_id, 2, 50, 75, 'ไอน้ำรวมตัวเป็นเมฆ', 'ไอน้ำลอยขึ้นสูงแล้วควบแน่นเป็นเมฆ', 'การควบแน่น', 'pending', 'pending');

  -- แบบร่างที่ยังไม่ได้ทำต่อ
  insert into videos (id, owner_id, project_id, title, topic, grade_level, subject, duration_min, format, style, status)
  values (v_draft_id, v_teacher_id, v_project_id, 'แรงและการเคลื่อนที่', 'แรงและการเคลื่อนที่', 'p5', 'science', 3, 'experiment', 'cartoon', 'draft');

  -- --- การแจ้งเตือนและประวัติการใช้งาน -----------------------------------
  insert into notifications (user_id, title, body, kind, video_id, read_at) values
    (v_teacher_id, '🎬 วิดีโอ “การเกิดฝน” สร้างเสร็จแล้ว', 'พร้อมดาวน์โหลดและแชร์เข้า Google Classroom ได้ทันที', 'video_ready', v_video_id, null),
    (v_teacher_id, '✨ คุณได้รับ 50 Credits', 'จากการเชิญเพื่อนครูมาใช้งาน', 'credits', null, now() - interval '3 days'),
    (v_teacher_id, '🔥 คุณใช้ AI สร้างสื่อครบ 10 ชิ้นในเดือนนี้', 'เก่งมากครับ! ลองสร้างชุดสื่อการสอนครบชุดดูไหม', 'milestone', null, now() - interval '5 days');

  insert into credit_transactions (user_id, amount, balance_after, reason, action, video_id) values
    (v_teacher_id, -1, 899, 'สร้างบทวิดีโอ', 'script', v_video_id),
    (v_teacher_id, -12, 887, 'สร้างภาพประกอบ', 'image', v_video_id),
    (v_teacher_id, -12, 875, 'สร้างเสียงบรรยาย', 'voice', v_video_id),
    (v_teacher_id, -5, 870, 'ประกอบเป็นวิดีโอ', 'render', v_video_id),
    (v_teacher_id, -20, 850, 'สร้างสื่อสำหรับวิดีโออื่น ๆ', null, null);

  insert into analytics_events (user_id, event, properties, created_at)
  select v_teacher_id, e.event, '{}'::jsonb, now() - (random() * interval '20 days')
  from (values
    ('signup_completed'), ('onboarding_completed'), ('create_started'), ('topic_analyzed'),
    ('script_generated'), ('storyboard_generated'), ('video_render_started'),
    ('first_video_completed'), ('video_exported'), ('video_shared'), ('assistant_used')
  ) as e(event);

  insert into ai_usage_logs (user_id, video_id, action, provider, model, cost_thb, success)
  values
    (v_teacher_id, v_video_id, 'script', 'anthropic', 'claude', 1.85, true),
    (v_teacher_id, v_video_id, 'image', 'openai', 'gpt-image', 6.40, true),
    (v_teacher_id, v_video_id, 'voice', 'google', 'neural2', 2.10, true),
    (v_teacher_id, v_video_id, 'render', 'shotstack', 'default', 4.50, true);

  update templates set usage_count = usage_count + 1 where title = 'การเกิดฝน';
end;
$$;
