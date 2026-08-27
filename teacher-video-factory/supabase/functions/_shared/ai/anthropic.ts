import { HttpError, withRetry } from '../http.ts';
import type { TextCompletionInput, TextCompletionResult, TextProvider } from './types.ts';

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';

export const anthropicText = (): TextProvider => {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  return {
    name: 'anthropic',
    async complete(input: TextCompletionInput): Promise<TextCompletionResult> {
      if (!apiKey) {
        throw new HttpError('AI_PROVIDER_ERROR', 'ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY');
      }

      return await withRetry(async () => {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: input.maxTokens ?? 4096,
            temperature: input.temperature ?? 0.7,
            system: input.json
              ? `${input.system}\n\nตอบกลับเป็น JSON ที่ถูกต้องเท่านั้น ห้ามมีข้อความอื่นนอก JSON`
              : input.system,
            messages: [{ role: 'user', content: input.prompt }],
          }),
        });

        if (!response.ok) {
          throw new HttpError(
            'AI_PROVIDER_ERROR',
            `Anthropic ตอบกลับ ${response.status}: ${await response.text()}`,
          );
        }

        const data = await response.json();
        const text = (data.content ?? [])
          .filter((part: { type: string }) => part.type === 'text')
          .map((part: { text: string }) => part.text)
          .join('');

        return {
          text,
          model: data.model ?? MODEL,
          inputTokens: data.usage?.input_tokens ?? 0,
          outputTokens: data.usage?.output_tokens ?? 0,
        };
      });
    },
  };
};
