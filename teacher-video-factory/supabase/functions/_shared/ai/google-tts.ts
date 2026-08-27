import { HttpError, withRetry } from '../http.ts';
import type { SpeechInput, SpeechProvider, SpeechResult } from './types.ts';

/**
 * Google Cloud Text-to-Speech — รองรับเสียงภาษาไทยแบบ Neural2 ที่ฟังเป็นธรรมชาติ
 * เหมาะกับบทเรียนภาษาไทยซึ่งเป็นกรณีใช้งานหลักของแอป
 */
export const googleSpeech = (): SpeechProvider => ({
  name: 'google',
  async synthesize(input: SpeechInput): Promise<SpeechResult> {
    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');

    if (!apiKey) {
      throw new HttpError('AI_PROVIDER_ERROR', 'ยังไม่ได้ตั้งค่า GOOGLE_TTS_API_KEY');
    }

    return await withRetry(async () => {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            input: { text: input.text },
            voice: {
              languageCode: input.language === 'en' ? 'en-US' : 'th-TH',
              name: input.voice,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: Math.min(4, Math.max(0.25, input.speed)),
              pitch: Math.min(20, Math.max(-20, input.pitch)),
              volumeGainDb: Math.min(16, Math.max(-96, (input.volume - 1) * 10)),
            },
          }),
        },
      );

      if (!response.ok) {
        throw new HttpError(
          'VOICE_GENERATION_FAILED',
          `สร้างเสียงไม่สำเร็จ (${response.status}): ${await response.text()}`,
        );
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new HttpError('VOICE_GENERATION_FAILED', 'ผู้ให้บริการไม่ได้ส่งไฟล์เสียงกลับมา');
      }

      return {
        bytes: Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0)),
        mimeType: 'audio/mpeg',
        durationSec: null,
      };
    }, { attempts: 2 });
  },
});
