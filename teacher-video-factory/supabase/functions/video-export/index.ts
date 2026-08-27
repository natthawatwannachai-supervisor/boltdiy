import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadVideo } from '../_shared/pipeline.ts';
import { enqueueStages } from '../_shared/queue.ts';

interface Body {
  video_id: string;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  resolution: '720p' | '1080p';
}

/**
 * ส่งออกไฟล์วิดีโอ — ถ้าสัดส่วน/ความละเอียดตรงกับที่ render ไว้แล้วจะคืนลิงก์ทันที
 * ถ้าไม่ตรง จะเข้าคิว render ใหม่ตามรูปแบบที่ครูเลือก
 */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    const { data: plan } = await service
      .from('plans')
      .select('max_resolution, watermark, name')
      .eq('key', (await service.from('subscriptions').select('plan').eq('user_id', user.id).single()).data?.plan ?? 'free')
      .single();

    if (body.resolution === '1080p' && plan?.max_resolution === '720p') {
      throw new HttpError(
        'PLAN_FEATURE_LOCKED',
        `แพ็กเกจ ${plan?.name ?? 'FREE'} ส่งออกได้สูงสุด 720p`,
      );
    }

    const sameFormat =
      video.aspect_ratio === body.aspect_ratio && video.resolution === body.resolution;

    if (sameFormat && video.video_url) {
      return json({
        status: 'ready',
        download_url: video.video_url,
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      });
    }

    await service
      .from('videos')
      .update({
        aspect_ratio: body.aspect_ratio,
        resolution: body.resolution,
        status: 'rendering',
        progress: 85,
      })
      .eq('id', videoId);

    await enqueueStages(service, { videoId, ownerId: user.id, stages: ['render'] });

    // ต้อง render ใหม่ตามสัดส่วน/ความละเอียดที่เลือก จึงตอบว่าเข้าคิวแล้วแทนการรอ
    return json({ status: 'queued', download_url: null, expires_at: null });
  }),
);
