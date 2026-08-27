import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { spendCreditsFor } from '../_shared/credits.ts';
import { assertOwner, loadVideo, runLessonKit } from '../_shared/pipeline.ts';

/** รันงานต่อหลังส่ง response แล้ว — API ของ Supabase Edge Runtime */
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

/** ฟีเจอร์พรีเมียม (สเปกข้อ 24): วิดีโอ 1 เรื่อง → สื่อการสอนครบชุด */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<{ video_id: string }>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    const { data: subscription } = await service
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    const plan = (subscription as { plan: string } | null)?.plan ?? 'free';

    if (plan !== 'pro_teacher' && plan !== 'school') {
      throw new HttpError(
        'PLAN_FEATURE_LOCKED',
        'ชุดสื่อการสอนครบชุดใช้ได้ในแพ็กเกจ PRO TEACHER ขึ้นไป',
      );
    }

    await spendCreditsFor(service, user.id, 'lesson_kit', 1, videoId);

    const { data: kit, error } = await service
      .from('lesson_kits')
      .insert({ video_id: videoId, owner_id: user.id, status: 'generating' })
      .select('id')
      .single();

    if (error || !kit) {
      throw new HttpError('UNKNOWN', 'สร้างชุดสื่อไม่สำเร็จ');
    }

    const kitId = (kit as { id: string }).id;

    // ปล่อยให้ทำงานต่อหลังตอบกลับ ครูไม่ต้องค้างรอหน้าจอ
    EdgeRuntime.waitUntil(
      runLessonKit(service, video, kitId).catch((err) =>
        console.error('[lesson-kit] สร้างไม่สำเร็จ', err),
      ),
    );

    return json({ kit_id: kitId });
  }),
);
