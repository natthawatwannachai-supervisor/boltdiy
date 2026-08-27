import { HttpError, withRetry } from '../http.ts';
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
  SpeechInput,
  SpeechProvider,
  SpeechResult,
  TextCompletionInput,
  TextCompletionResult,
  TextProvider,
} from './types.ts';

const BASE_URL = Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
const TEXT_MODEL = Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-4.1';
const IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1';
const SPEECH_MODEL = Deno.env.get('OPENAI_SPEECH_MODEL') ?? 'gpt-4o-mini-tts';

const requireKey = () => {
  const key = Deno.env.get('OPENAI_API_KEY');

  if (!key) {
    throw new HttpError('AI_PROVIDER_ERROR', 'ยังไม่ได้ตั้งค่า OPENAI_API_KEY');
  }

  return key;
};

const SIZE_BY_RATIO: Record<ImageGenerationInput['aspectRatio'], string> = {
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '1:1': '1024x1024',
};

export const openAiText = (): TextProvider => ({
  name: 'openai',
  async complete(input: TextCompletionInput): Promise<TextCompletionResult> {
    const apiKey = requireKey();

    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: TEXT_MODEL,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 4096,
          response_format: input.json ? { type: 'json_object' } : undefined,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new HttpError('AI_PROVIDER_ERROR', `OpenAI ตอบกลับ ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      return {
        text: data.choices?.[0]?.message?.content ?? '',
        model: data.model ?? TEXT_MODEL,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      };
    });
  },
});

export const openAiImage = (): ImageProvider => ({
  name: 'openai',
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const apiKey = requireKey();

    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: input.prompt,
          size: SIZE_BY_RATIO[input.aspectRatio],
          quality: input.quality === 'high' ? 'high' : 'medium',
          n: 1,
        }),
      });

      if (!response.ok) {
        throw new HttpError(
          'IMAGE_GENERATION_FAILED',
          `สร้างภาพไม่สำเร็จ (${response.status}): ${await response.text()}`,
        );
      }

      const data = await response.json();
      const base64 = data.data?.[0]?.b64_json;

      if (!base64) {
        throw new HttpError('IMAGE_GENERATION_FAILED', 'ผู้ให้บริการไม่ได้ส่งไฟล์ภาพกลับมา');
      }

      return {
        bytes: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
        mimeType: 'image/png',
        model: IMAGE_MODEL,
      };
    }, { attempts: 2 });
  },
});

export const openAiSpeech = (): SpeechProvider => ({
  name: 'openai',
  async synthesize(input: SpeechInput): Promise<SpeechResult> {
    const apiKey = requireKey();

    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: SPEECH_MODEL,
          voice: input.voice,
          input: input.text,
          speed: Math.min(4, Math.max(0.25, input.speed)),
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        throw new HttpError(
          'VOICE_GENERATION_FAILED',
          `สร้างเสียงไม่สำเร็จ (${response.status}): ${await response.text()}`,
        );
      }

      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        mimeType: 'audio/mpeg',
        durationSec: null,
      };
    }, { attempts: 2 });
  },
});
