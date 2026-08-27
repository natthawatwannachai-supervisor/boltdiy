import { HttpError, withRetry } from '../http.ts';
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
  TextCompletionInput,
  TextCompletionResult,
  TextProvider,
} from './types.ts';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const TEXT_MODEL = Deno.env.get('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash';
const IMAGE_MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') ?? 'imagen-4.0-generate-001';

const requireKey = () => {
  const key = Deno.env.get('GEMINI_API_KEY');

  if (!key) {
    throw new HttpError('AI_PROVIDER_ERROR', 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY');
  }

  return key;
};

export const geminiText = (): TextProvider => ({
  name: 'gemini',
  async complete(input: TextCompletionInput): Promise<TextCompletionResult> {
    const apiKey = requireKey();

    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.temperature ?? 0.7,
            maxOutputTokens: input.maxTokens ?? 4096,
            responseMimeType: input.json ? 'application/json' : 'text/plain',
          },
        }),
      });

      if (!response.ok) {
        throw new HttpError('AI_PROVIDER_ERROR', `Gemini ตอบกลับ ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((part: { text?: string }) => part.text ?? '')
        .join('');

      return {
        text,
        model: TEXT_MODEL,
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      };
    });
  },
});

const RATIO_LABEL: Record<ImageGenerationInput['aspectRatio'], string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
};

export const geminiImage = (): ImageProvider => ({
  name: 'gemini',
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const apiKey = requireKey();

    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/models/${IMAGE_MODEL}:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: input.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: RATIO_LABEL[input.aspectRatio],
            personGeneration: 'allow_all',
          },
        }),
      });

      if (!response.ok) {
        throw new HttpError(
          'IMAGE_GENERATION_FAILED',
          `สร้างภาพไม่สำเร็จ (${response.status}): ${await response.text()}`,
        );
      }

      const data = await response.json();
      const base64 = data.predictions?.[0]?.bytesBase64Encoded;

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
