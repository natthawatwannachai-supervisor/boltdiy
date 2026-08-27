import { HttpError, withRetry } from '../http.ts';
import type { RenderHandle, RenderInput, RenderStatus, VideoProvider } from './types.ts';

const RESOLUTION_SIZE = {
  '16:9': { '720p': { width: 1280, height: 720 }, '1080p': { width: 1920, height: 1080 } },
  '9:16': { '720p': { width: 720, height: 1280 }, '1080p': { width: 1080, height: 1920 } },
  '1:1': { '720p': { width: 720, height: 720 }, '1080p': { width: 1080, height: 1080 } },
} as const;

const FONT_FAMILY: Record<string, string> = {
  Sarabun: 'Sarabun',
  Prompt: 'Prompt',
  Kanit: 'Kanit',
  NotoSansThai: 'Noto Sans Thai',
};

/**
 * ผู้ให้บริการ render วิดีโอ (Shotstack) — รับ timeline เป็น JSON แล้วคืนไฟล์ MP4
 * แยกเป็น adapter เพื่อให้เปลี่ยนไปใช้ FFmpeg worker ของเราเองได้ในอนาคต
 */
export const shotstackVideo = (): VideoProvider => {
  const apiKey = Deno.env.get('SHOTSTACK_API_KEY');
  const env = Deno.env.get('SHOTSTACK_ENV') ?? 'stage';
  const baseUrl = `https://api.shotstack.io/edit/${env}`;

  const requireKey = () => {
    if (!apiKey) {
      throw new HttpError('RENDER_FAILED', 'ยังไม่ได้ตั้งค่า SHOTSTACK_API_KEY');
    }

    return apiKey;
  };

  return {
    name: 'shotstack',

    async render(input: RenderInput): Promise<RenderHandle> {
      const key = requireKey();
      const size = RESOLUTION_SIZE[input.aspectRatio][input.resolution];
      const totalLength = input.clips.reduce((max, clip) => Math.max(max, clip.endSec), 0);

      const imageTrack = {
        clips: input.clips.map((clip) => ({
          asset: { type: 'image', src: clip.imageUrl },
          start: clip.startSec,
          length: Math.max(0.5, clip.endSec - clip.startSec),
          fit: 'cover',
          effect: 'zoomIn',
          transition: clip.transition ? { in: clip.transition, out: clip.transition } : undefined,
        })),
      };

      const voiceTrack = {
        clips: input.clips
          .filter((clip) => Boolean(clip.audioUrl))
          .map((clip) => ({
            asset: { type: 'audio', src: clip.audioUrl, volume: 1 },
            start: clip.startSec,
            length: Math.max(0.5, clip.endSec - clip.startSec),
          })),
      };

      const onScreenTrack = {
        clips: input.clips
          .filter((clip) => Boolean(clip.onScreenText))
          .map((clip) => ({
            asset: {
              type: 'text',
              text: clip.onScreenText,
              font: { family: FONT_FAMILY[input.subtitleFont] ?? 'Sarabun', size: 48, color: '#FFFFFF' },
              stroke: { color: '#0B1F5B', width: 2 },
              alignment: { horizontal: 'center', vertical: 'top' },
            },
            start: clip.startSec,
            length: Math.min(4, Math.max(1, clip.endSec - clip.startSec)),
          })),
      };

      const subtitleTrack = {
        clips: input.subtitles.map((cue) => ({
          asset: {
            type: 'text',
            text: cue.text,
            font: {
              family: FONT_FAMILY[input.subtitleFont] ?? 'Sarabun',
              size: input.subtitleSize,
              color: input.subtitleStyle === 'highlight' ? '#FDE047' : '#FFFFFF',
            },
            background:
              input.subtitleStyle === 'caption'
                ? { color: '#0B1F5B', opacity: 0.72, padding: 12, borderRadius: 8 }
                : undefined,
            stroke: { color: '#000000', width: 2 },
            alignment: { horizontal: 'center', vertical: 'bottom' },
          },
          start: cue.startSec,
          length: Math.max(0.6, cue.endSec - cue.startSec),
        })),
      };

      const tracks: unknown[] = [subtitleTrack, onScreenTrack, voiceTrack, imageTrack];

      if (input.watermark) {
        tracks.unshift({
          clips: [
            {
              asset: {
                type: 'text',
                text: 'สร้างด้วย Teacher Video Factory',
                font: { family: 'Sarabun', size: 22, color: '#FFFFFF', opacity: 0.7 },
                alignment: { horizontal: 'right', vertical: 'bottom' },
              },
              start: 0,
              length: totalLength,
            },
          ],
        });
      }

      if (input.logoUrl) {
        tracks.unshift({
          clips: [
            {
              asset: { type: 'image', src: input.logoUrl },
              start: 0,
              length: totalLength,
              scale: 0.12,
              position: 'topRight',
            },
          ],
        });
      }

      const body = {
        timeline: {
          background: '#0B1F5B',
          soundtrack: input.musicUrl ? { src: input.musicUrl, effect: 'fadeInFadeOut', volume: 0.15 } : undefined,
          tracks,
        },
        output: {
          format: 'mp4',
          size,
          fps: 25,
        },
        callback: input.callbackUrl ?? undefined,
      };

      return await withRetry(async () => {
        const response = await fetch(`${baseUrl}/render`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': key },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new HttpError('RENDER_FAILED', `ส่งงาน render ไม่สำเร็จ (${response.status}): ${await response.text()}`);
        }

        const data = await response.json();

        return { providerJobId: data.response?.id as string };
      }, { attempts: 2 });
    },

    async poll(providerJobId: string): Promise<RenderStatus> {
      const key = requireKey();
      const response = await fetch(`${baseUrl}/render/${providerJobId}`, {
        headers: { 'x-api-key': key },
      });

      if (!response.ok) {
        return { status: 'failed', url: null, error: `ตรวจสอบสถานะไม่สำเร็จ (${response.status})` };
      }

      const data = await response.json();
      const status = data.response?.status as string;

      if (status === 'done') {
        return { status: 'done', url: data.response?.url ?? null, error: null };
      }

      if (status === 'failed') {
        return { status: 'failed', url: null, error: data.response?.error ?? 'render ไม่สำเร็จ' };
      }

      return { status: status === 'queued' ? 'queued' : 'rendering', url: null, error: null };
    },
  };
};
