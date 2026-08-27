import { json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { assertOwner, loadVideo, runSubtitles } from '../_shared/pipeline.ts';

interface Body {
  video_id: string;
  language?: 'th' | 'en';
  style?: string;
}

Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);
    const videoId = requireString(body.video_id, 'video_id');

    const service = serviceClient();
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    if (body.language || body.style) {
      await service
        .from('videos')
        .update({
          subtitle_language: body.language ?? video.subtitle_language,
          subtitle_style: body.style ?? video.subtitle_style,
        })
        .eq('id', videoId);
    }

    const refreshed = await loadVideo(service, videoId);
    const cues = await runSubtitles(service, refreshed);

    return json({ cues });
  }),
);
