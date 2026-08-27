import { json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadVideo, runQuality } from '../_shared/pipeline.ts';

Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<{ video_id: string }>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    const report = await runQuality(service, video);

    return json({ report });
  }),
);
