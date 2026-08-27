import { HttpError, json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { spendCredits } from '../_shared/credits.ts';
import { assertOwner, loadScenes, loadVideo } from '../_shared/pipeline.ts';
import { enqueueStages } from '../_shared/queue.ts';
import { getSpeechProvider } from '../_shared/ai/registry.ts';
import { uploadGenerated } from '../_shared/storage.ts';

interface Body {
  mode: 'preview' | 'all';
  video_id?: string;
  voice_id?: string;
  text?: string;
  speed?: number;
  pitch?: number;
  language?: 'th' | 'en';
}

/** ฟังตัวอย่างเสียง และสั่งสร้างเสียงบรรยายทั้งคลิป */
Deno.serve(
  serveJson(async (req) => {
    const { user, client } = await requireUser(req);
    const body = await readBody<Body>(req);
    const service = serviceClient();

    if (body.mode === 'preview') {
      const voiceId = requireString(body.voice_id, 'voice_id');
      const text = requireString(body.text, 'text').slice(0, 300);

      await spendCredits(client, 'voice', 1, null);

      const provider = getSpeechProvider();
      const { data: voiceRow } = await service
        .from('voices')
        .select('provider_voice')
        .eq('id', voiceId)
        .maybeSingle();

      const providerVoice =
        (voiceRow as { provider_voice: Record<string, string> } | null)?.provider_voice?.[provider.name];

      if (!providerVoice) {
        throw new HttpError('VALIDATION_ERROR', 'ไม่พบเสียงที่เลือกในระบบ');
      }

      const audio = await provider.synthesize({
        text,
        voice: providerVoice,
        language: body.language ?? 'th',
        speed: body.speed ?? 1,
        pitch: body.pitch ?? 0,
        volume: 1,
      });

      const uploaded = await uploadGenerated(service, {
        bucket: 'scene-audio',
        ownerId: user.id,
        videoId: 'previews',
        fileName: `${voiceId}-${Date.now()}.mp3`,
        bytes: audio.bytes,
        contentType: audio.mimeType,
        provider: provider.name,
      });

      return json({ audio_url: uploaded.publicUrl });
    }

    const videoId = requireString(body.video_id, 'video_id');
    const video = await loadVideo(service, videoId);
    assertOwner(video, user.id);

    const scenes = await loadScenes(service, videoId);
    const pending = scenes.filter((scene) => scene.audio_status !== 'ready' && scene.narration.trim());

    if (!pending.length) {
      return json({ queued: 0 });
    }

    await enqueueStages(service, { videoId, ownerId: user.id, stages: ['voice'] });

    return json({ queued: pending.length });
  }),
);
