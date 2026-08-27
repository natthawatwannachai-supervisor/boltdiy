import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadVideo, runThumbnails } from '../_shared/pipeline.ts';

interface Body {
  video_id: string;
  mode?: 'generate' | 'select';
  thumbnail_id?: string;
}

Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    if (body.mode === 'select') {
      const thumbnailId = requireString(body.thumbnail_id, 'thumbnail_id');

      // แบบที่ครูเลือกถูกอ้างด้วยลำดับของไฟล์ thumbnail ล่าสุดของวิดีโอนี้
      const { data: assets } = await service
        .from('assets')
        .select('public_url')
        .eq('video_id', videoId)
        .eq('kind', 'thumbnail')
        .order('created_at', { ascending: false })
        .limit(3);

      const chosen = (assets ?? [])[Number(thumbnailId) - 1] as { public_url: string } | undefined;

      if (!chosen) {
        throw new HttpError('NOT_FOUND', 'ไม่พบ Thumbnail ที่เลือก');
      }

      const { data: updated } = await service
        .from('videos')
        .update({ thumbnail_url: chosen.public_url })
        .eq('id', videoId)
        .select('*')
        .single();

      return json({ video: updated });
    }

    const options = await runThumbnails(service, video);

    return json({ options });
  }),
);
