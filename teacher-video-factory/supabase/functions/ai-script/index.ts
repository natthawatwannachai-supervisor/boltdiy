import { json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import {
  assertOwner,
  loadVideo,
  runAddScene,
  runRegenerateScene,
  runScript,
} from '../_shared/pipeline.ts';

interface Body {
  video_id: string;
  mode?: 'full' | 'regenerate_scene' | 'add_scene';
  scene_id?: string;
  after_scene_id?: string | null;
  instruction?: string;
}

/** จัดการบทวิดีโอทั้งชุด และการแก้ไขรายฉาก (สร้างใหม่ / เพิ่มฉาก) */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    if (body.mode === 'regenerate_scene') {
      const scene = await runRegenerateScene(
        service,
        video,
        requireString(body.scene_id, 'scene_id'),
        body.instruction,
      );

      return json({ scene });
    }

    if (body.mode === 'add_scene') {
      const scene = await runAddScene(service, video, body.after_scene_id ?? null);

      return json({ scene });
    }

    const scenes = await runScript(service, video);

    return json({ scenes });
  }),
);
