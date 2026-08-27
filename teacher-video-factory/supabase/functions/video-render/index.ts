import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadScenes, loadVideo } from '../_shared/pipeline.ts';
import { enqueueStages } from '../_shared/queue.ts';

/**
 * เข้าคิวงานประกอบวิดีโอ ครูปิดแอปได้ทันที
 * ระบบจะแจ้งเตือนเมื่อไฟล์พร้อม (สเปกข้อ 32–33)
 */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<{ video_id: string }>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    const scenes = await loadScenes(service, videoId);

    if (!scenes.length) {
      throw new HttpError('VALIDATION_ERROR', 'ยังไม่มีบทวิดีโอ กรุณาสร้างบทและภาพก่อน');
    }

    if (!scenes.some((scene) => scene.image_status === 'ready')) {
      throw new HttpError('VALIDATION_ERROR', 'ยังไม่มีภาพประกอบ กรุณาสร้างภาพก่อนประกอบวิดีโอ');
    }

    await service
      .from('videos')
      .update({ status: 'rendering', progress: 85, error_message: null })
      .eq('id', videoId);

    await enqueueStages(service, {
      videoId,
      ownerId: user.id,
      stages: ['render', 'quality', 'thumbnail'],
    });

    const { data: job } = await service
      .from('jobs')
      .select('id')
      .eq('video_id', videoId)
      .eq('stage', 'render')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return json({ job_id: (job as { id: string } | null)?.id ?? '' });
  }),
);
