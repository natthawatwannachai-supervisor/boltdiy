/**
 * AI Service Layer — สัญญากลางที่แยกแอปออกจากผู้ให้บริการ AI
 * ทุกฟีเจอร์เรียกผ่าน interface เหล่านี้เท่านั้น จึงสลับ provider ได้ด้วยการแก้ env
 */

export interface TextCompletionInput {
  system: string;
  prompt: string;
  /** บังคับให้ผลลัพธ์เป็น JSON ล้วน */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface TextCompletionResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface TextProvider {
  readonly name: string;
  complete(input: TextCompletionInput): Promise<TextCompletionResult>;
}

export interface ImageGenerationInput {
  prompt: string;
  /** อัตราส่วนภาพของวิดีโอ ใช้เลือกขนาดที่ provider รองรับ */
  aspectRatio: '16:9' | '9:16' | '1:1';
  quality: 'standard' | 'high';
}

export interface ImageGenerationResult {
  bytes: Uint8Array;
  mimeType: string;
  model: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}

export interface SpeechInput {
  text: string;
  /** voice id ของ provider (map มาจากตาราง voices.provider_voice) */
  voice: string;
  language: 'th' | 'en';
  speed: number;
  pitch: number;
  volume: number;
}

export interface SpeechResult {
  bytes: Uint8Array;
  mimeType: string;
  durationSec: number | null;
}

export interface SpeechProvider {
  readonly name: string;
  synthesize(input: SpeechInput): Promise<SpeechResult>;
}

export interface RenderClip {
  imageUrl: string;
  audioUrl: string | null;
  startSec: number;
  endSec: number;
  onScreenText: string | null;
  transition: string | null;
}

export interface RenderSubtitle {
  startSec: number;
  endSec: number;
  text: string;
}

export interface RenderInput {
  clips: RenderClip[];
  subtitles: RenderSubtitle[];
  subtitleStyle: string;
  subtitleFont: string;
  subtitleSize: number;
  musicUrl: string | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '720p' | '1080p';
  watermark: boolean;
  logoUrl: string | null;
  callbackUrl: string | null;
}

export interface RenderHandle {
  providerJobId: string;
}

export interface RenderStatus {
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url: string | null;
  error: string | null;
}

export interface VideoProvider {
  readonly name: string;
  render(input: RenderInput): Promise<RenderHandle>;
  poll(providerJobId: string): Promise<RenderStatus>;
}
