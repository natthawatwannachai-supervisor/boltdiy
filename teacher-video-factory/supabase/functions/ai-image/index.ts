import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadScenes, loadVideo, runSceneImage } from '../_shared/pipeline.ts';
import { enqueueStages } from '../_shared/queue.ts';

interface Body {
  video_id: string;
  scene_id?: string;
  mode?: 'single' | 'all';
  prompt_override?: string;
  style_override?: string;
}

/**
 * สร้างภาพประกอบ — โหมด single ทำทันทีเพื่อให้ครูเห็นผลเร็ว
 * ส่วนโหมด all เข้าคิวเบื้องหลังเพราะใช้เวลานานเกินอายุของ request เดียว
 */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    if (body.mode === 'all') {
      const scenes = await loadScenes(service, videoId);
      const pending = scenes.filter((scene) => scene.image_status !== 'ready');

      if (!pending.length) {
        return json({ queued: 0 });
      }

      await enqueueStages(service, { videoId, ownerId: user.id, stages: ['images'] });

      return json({ queued: pending.length });
    }

    const sceneId = requireString(body.scene_id, 'scene_id');
    const scenes = await loadScenes(service, videoId);
    const scene = scenes.find((item) => item.id === sceneId);

    if (!scene) {
      throw new HttpError('NOT_FOUND', 'ไม่พบฉากที่ต้องการ');
    }

    const updated = await runSceneImage(service, video, scene, {
      promptOverride: body.prompt_override,
      styleOverride: body.style_override,
    });

    return json({ scene: updated });
  }),
);
