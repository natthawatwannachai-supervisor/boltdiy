import { HttpError } from '../http.ts';
import { anthropicText } from './anthropic.ts';
import { geminiImage, geminiText } from './gemini.ts';
import { googleSpeech } from './google-tts.ts';
import { openAiImage, openAiSpeech, openAiText } from './openai.ts';
import { shotstackVideo } from './shotstack.ts';
import type { ImageProvider, SpeechProvider, TextProvider, VideoProvider } from './types.ts';

/**
 * เลือกผู้ให้บริการจาก environment variable — ไม่มีที่ไหนในระบบผูกกับ provider เดียวโดยตรง
 * เปลี่ยน provider ได้โดยไม่ต้องแก้โค้ดฟีเจอร์หรือแอปมือถือ
 */
export const getTextProvider = (): TextProvider => {
  switch (Deno.env.get('AI_TEXT_PROVIDER') ?? 'anthropic') {
    case 'openai':
      return openAiText();
    case 'gemini':
      return geminiText();
    case 'anthropic':
      return anthropicText();
    default:
      throw new HttpError('AI_PROVIDER_ERROR', 'ค่า AI_TEXT_PROVIDER ไม่ถูกต้อง');
  }
};

export const getImageProvider = (): ImageProvider => {
  switch (Deno.env.get('AI_IMAGE_PROVIDER') ?? 'openai') {
    case 'gemini':
      return geminiImage();
    case 'openai':
      return openAiImage();
    default:
      throw new HttpError('AI_PROVIDER_ERROR', 'ค่า AI_IMAGE_PROVIDER ไม่ถูกต้อง');
  }
};

export const getSpeechProvider = (): SpeechProvider => {
  switch (Deno.env.get('AI_SPEECH_PROVIDER') ?? 'google') {
    case 'openai':
      return openAiSpeech();
    case 'google':
      return googleSpeech();
    default:
      throw new HttpError('AI_PROVIDER_ERROR', 'ค่า AI_SPEECH_PROVIDER ไม่ถูกต้อง');
  }
};

export const getVideoProvider = (): VideoProvider => {
  switch (Deno.env.get('AI_VIDEO_PROVIDER') ?? 'shotstack') {
    case 'shotstack':
      return shotstackVideo();
    default:
      throw new HttpError('AI_PROVIDER_ERROR', 'ค่า AI_VIDEO_PROVIDER ไม่ถูกต้อง');
  }
};

/** ชื่อ provider ที่ใช้จริง สำหรับบันทึกลง ai_usage_logs */
export const providerNames = () => ({
  text: Deno.env.get('AI_TEXT_PROVIDER') ?? 'anthropic',
  image: Deno.env.get('AI_IMAGE_PROVIDER') ?? 'openai',
  speech: Deno.env.get('AI_SPEECH_PROVIDER') ?? 'google',
  video: Deno.env.get('AI_VIDEO_PROVIDER') ?? 'shotstack',
});
