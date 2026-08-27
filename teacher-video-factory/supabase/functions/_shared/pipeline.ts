import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http.ts';
import { parseJsonResponse } from './json.ts';
import { planScenes, toLessonContext, type VideoRecord } from './lesson.ts';
import {
  getImageProvider,
  getSpeechProvider,
  getTextProvider,
  getVideoProvider,
  providerNames,
} from './ai/registry.ts';
import {
  addScenePrompt,
  analyzePrompt,
  imagePromptRequest,
  lessonKitPrompt,
  objectivesPrompt,
  qualityPrompt,
  regenerateScenePrompt,
  scriptPrompt,
  subtitlePrompt,
  systemPrompt,
  thumbnailPrompt,
  STYLE_PROMPT,
} from './prompts.ts';
import { logAiUsage, spendCreditsFor } from './credits.ts';
import { uploadGenerated } from './storage.ts';

export interface SceneRecord {
  id: string;
  video_id: string;
  index: number;
  start_sec: number;
  end_sec: number;
  visual_description: string;
  narration: string;
  on_screen_text: string | null;
  transition: string | null;
  image_prompt: string | null;
  image_url: string | null;
  image_status: string;
  audio_url: string | null;
  audio_status: string;
}

export const loadVideo = async (service: SupabaseClient, videoId: string): Promise<VideoRecord> => {
  const { data, error } = await service.from('videos').select('*').eq('id', videoId).single();

  if (error || !data) {
    throw new HttpError('NOT_FOUND', 'ไม่พบวิดีโอที่ต้องการ');
  }

  return data as VideoRecord;
};

export const assertOwner = (video: VideoRecord, userId: string) => {
  if (video.owner_id !== userId) {
    throw new HttpError('UNAUTHORIZED', 'คุณไม่มีสิทธิ์แก้ไขวิดีโอนี้');
  }
};

export const loadScenes = async (service: SupabaseClient, videoId: string): Promise<SceneRecord[]> => {
  const { data, error } = await service
    .from('scenes')
    .select('*')
    .eq('video_id', videoId)
    .order('index', { ascending: true });

  if (error) {
    throw new HttpError('UNKNOWN', error.message);
  }

  return (data ?? []) as SceneRecord[];
};

// ---------------------------------------------------------------------------
// ขั้นที่ 0 — วิเคราะห์ประโยคเดียวของครู
// ---------------------------------------------------------------------------
export interface AnalyzeOutput {
  topic: string;
  grade_level: string;
  subject: string;
  duration_min: number;
  format: string;
  style: string;
  suggested_title: string;
  detected: { field: string; label: string; value: string }[];
}

export const runAnalyze = async (
  service: SupabaseClient,
  userId: string,
  prompt: string,
): Promise<AnalyzeOutput> => {
  const provider = getTextProvider();
  const started = Date.now();

  const result = await provider.complete({
    system: systemPrompt(),
    prompt: analyzePrompt(prompt),
    json: true,
    temperature: 0.3,
    maxTokens: 1200,
  });

  await logAiUsage(service, {
    userId,
    videoId: null,
    action: 'analyze',
    provider: provider.name,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: Date.now() - started,
  });

  const parsed = parseJsonResponse<AnalyzeOutput>(result.text);

  // ความยาวที่ครูเลือกได้มีเฉพาะค่าที่กำหนดไว้ จึงปัดเข้าค่าที่ใกล้ที่สุด
  const allowed = [1, 3, 5, 10, 15];
  parsed.duration_min = allowed.reduce((best, value) =>
    Math.abs(value - (parsed.duration_min ?? 5)) < Math.abs(best - (parsed.duration_min ?? 5)) ? value : best,
  5);

  return parsed;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 2 — วัตถุประสงค์การเรียนรู้
// ---------------------------------------------------------------------------
export const runObjectives = async (service: SupabaseClient, video: VideoRecord) => {
  await spendCreditsFor(service, video.owner_id, 'objectives', 1, video.id);

  const provider = getTextProvider();
  const started = Date.now();
  const result = await provider.complete({
    system: systemPrompt(),
    prompt: objectivesPrompt(toLessonContext(video)),
    json: true,
    temperature: 0.5,
    maxTokens: 1000,
  });

  await logAiUsage(service, {
    userId: video.owner_id,
    videoId: video.id,
    action: 'objectives',
    provider: provider.name,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: Date.now() - started,
  });

  const parsed = parseJsonResponse<{ objectives: { text: string; bloom?: string }[] }>(result.text);
  const objectives = parsed.objectives.map((objective, index) => ({
    id: `obj-${index + 1}`,
    text: objective.text,
    bloom: objective.bloom,
  }));

  await service.from('videos').update({ objectives }).eq('id', video.id);

  return objectives;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 3 — บทวิดีโอและการแบ่งฉาก
// ---------------------------------------------------------------------------
interface RawScene {
  visual: string;
  narration: string;
  on_screen_text?: string;
  transition?: string;
}

export const runScript = async (service: SupabaseClient, video: VideoRecord) => {
  await spendCreditsFor(service, video.owner_id, 'script', 1, video.id);

  const plan = planScenes(video.duration_min);
  const provider = getTextProvider();
  const started = Date.now();

  const result = await provider.complete({
    system: systemPrompt(),
    prompt: scriptPrompt(toLessonContext(video), plan.sceneCount, plan.secondsPerScene),
    json: true,
    temperature: 0.7,
    maxTokens: 8000,
  });

  await logAiUsage(service, {
    userId: video.owner_id,
    videoId: video.id,
    action: 'script',
    provider: provider.name,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: Date.now() - started,
  });

  const parsed = parseJsonResponse<{ hook: string; summary: string; scenes: RawScene[] }>(result.text);

  if (!parsed.scenes?.length) {
    throw new HttpError('AI_PROVIDER_ERROR', 'AI ไม่ได้ส่งบทวิดีโอกลับมา กรุณาลองอีกครั้ง');
  }

  // เขียนบทใหม่ทั้งชุด จึงล้างฉากเดิมออกก่อนเพื่อไม่ให้ลำดับซ้ำ
  await service.from('scenes').delete().eq('video_id', video.id);

  const secondsEach = Math.floor(plan.totalSeconds / parsed.scenes.length);
  const rows = parsed.scenes.map((scene, index) => ({
    video_id: video.id,
    index,
    start_sec: index * secondsEach,
    end_sec: index === parsed.scenes.length - 1 ? plan.totalSeconds : (index + 1) * secondsEach,
    visual_description: scene.visual ?? '',
    narration: scene.narration ?? '',
    on_screen_text: scene.on_screen_text ?? null,
    transition: scene.transition ?? 'fade',
  }));

  const { error } = await service.from('scenes').insert(rows);

  if (error) {
    throw new HttpError('UNKNOWN', `บันทึกฉากไม่สำเร็จ: ${error.message}`);
  }

  const { data: versionRow } = await service
    .from('scripts')
    .select('version')
    .eq('video_id', video.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  await service.from('scripts').insert({
    video_id: video.id,
    version: ((versionRow as { version: number } | null)?.version ?? 0) + 1,
    hook: parsed.hook ?? '',
    summary: parsed.summary ?? '',
    full_text: parsed.scenes.map((scene) => scene.narration).join('\n\n'),
    model: result.model,
  });

  return await loadScenes(service, video.id);
};

export const runRegenerateScene = async (
  service: SupabaseClient,
  video: VideoRecord,
  sceneId: string,
  instruction?: string,
) => {
  await spendCreditsFor(service, video.owner_id, 'script', 1, video.id);

  const scenes = await loadScenes(service, video.id);
  const scene = scenes.find((item) => item.id === sceneId);

  if (!scene) {
    throw new HttpError('NOT_FOUND', 'ไม่พบฉากที่ต้องการแก้ไข');
  }

  const provider = getTextProvider();
  const result = await provider.complete({
    system: systemPrompt(),
    prompt: regenerateScenePrompt(
      toLessonContext(video),
      { index: scene.index, visual: scene.visual_description, narration: scene.narration },
      instruction,
    ),
    json: true,
    temperature: 0.85,
    maxTokens: 1200,
  });

  const parsed = parseJsonResponse<RawScene>(result.text);

  const { data, error } = await service
    .from('scenes')
    .update({
      visual_description: parsed.visual,
      narration: parsed.narration,
      on_screen_text: parsed.on_screen_text ?? null,
      transition: parsed.transition ?? scene.transition,
      // ภาพและเสียงเดิมไม่ตรงกับบทใหม่แล้ว จึงต้องสร้างใหม่
      image_status: 'pending',
      image_url: null,
      image_prompt: null,
      audio_status: 'pending',
      audio_url: null,
    })
    .eq('id', sceneId)
    .select('*')
    .single();

  if (error) {
    throw new HttpError('UNKNOWN', error.message);
  }

  return data as SceneRecord;
};

export const runAddScene = async (
  service: SupabaseClient,
  video: VideoRecord,
  afterSceneId: string | null,
) => {
  await spendCreditsFor(service, video.owner_id, 'script', 1, video.id);

  const scenes = await loadScenes(service, video.id);
  const afterIndex = afterSceneId
    ? (scenes.find((scene) => scene.id === afterSceneId)?.index ?? scenes.length - 1)
    : scenes.length - 1;

  const provider = getTextProvider();
  const result = await provider.complete({
    system: systemPrompt(),
    prompt: addScenePrompt(
      toLessonContext(video),
      scenes[afterIndex]?.narration ?? null,
      scenes[afterIndex + 1]?.narration ?? null,
    ),
    json: true,
    temperature: 0.8,
    maxTokens: 1200,
  });

  const parsed = parseJsonResponse<RawScene>(result.text);
  const newIndex = afterIndex + 1;

  // เลื่อน index ของฉากหลังจุดแทรกออกไป 1 ตำแหน่ง (ใช้ค่าลบชั่วคราวกัน unique ชน)
  for (const scene of scenes.filter((item) => item.index >= newIndex).reverse()) {
    await service.from('scenes').update({ index: scene.index + 1 }).eq('id', scene.id);
  }

  const duration = Math.round((video.duration_min * 60) / (scenes.length + 1));

  const { data, error } = await service
    .from('scenes')
    .insert({
      video_id: video.id,
      index: newIndex,
      start_sec: newIndex * duration,
      end_sec: (newIndex + 1) * duration,
      visual_description: parsed.visual,
      narration: parsed.narration,
      on_screen_text: parsed.on_screen_text ?? null,
      transition: parsed.transition ?? 'fade',
    })
    .select('*')
    .single();

  if (error) {
    throw new HttpError('UNKNOWN', error.message);
  }

  return data as SceneRecord;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 4 — Storyboard (สร้าง prompt ภาพให้ทุกฉาก)
// ---------------------------------------------------------------------------
export const runStoryboard = async (service: SupabaseClient, video: VideoRecord) => {
  await spendCreditsFor(service, video.owner_id, 'storyboard', 1, video.id);

  const scenes = await loadScenes(service, video.id);

  if (!scenes.length) {
    throw new HttpError('VALIDATION_ERROR', 'ยังไม่มีบทวิดีโอ กรุณาสร้างบทก่อน');
  }

  const provider = getTextProvider();
  const result = await provider.complete({
    system: systemPrompt(),
    prompt: imagePromptRequest(
      toLessonContext(video),
      scenes.map((scene) => ({ index: scene.index, visual: scene.visual_description })),
    ),
    json: true,
    temperature: 0.6,
    maxTokens: 4000,
  });

  const parsed = parseJsonResponse<{ prompts: { index: number; prompt: string }[] }>(result.text);

  for (const item of parsed.prompts ?? []) {
    const scene = scenes.find((candidate) => candidate.index === item.index);

    if (scene) {
      await service.from('scenes').update({ image_prompt: item.prompt }).eq('id', scene.id);
    }
  }

  const { data: versionRow } = await service
    .from('storyboards')
    .select('version')
    .eq('video_id', video.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  await service.from('storyboards').insert({
    video_id: video.id,
    version: ((versionRow as { version: number } | null)?.version ?? 0) + 1,
    scenes: scenes.map((scene) => ({
      index: scene.index,
      visual_description: scene.visual_description,
      image_prompt: parsed.prompts?.find((p) => p.index === scene.index)?.prompt ?? null,
      start_sec: scene.start_sec,
      end_sec: scene.end_sec,
    })),
  });

  return await loadScenes(service, video.id);
};

// ---------------------------------------------------------------------------
// ขั้นที่ 5 — ภาพประกอบรายฉาก
// ---------------------------------------------------------------------------
export const runSceneImage = async (
  service: SupabaseClient,
  video: VideoRecord,
  scene: SceneRecord,
  options: { promptOverride?: string; styleOverride?: string } = {},
) => {
  await spendCreditsFor(service, video.owner_id, 'image', 1, video.id);
  await service.from('scenes').update({ image_status: 'generating' }).eq('id', scene.id);

  const style = STYLE_PROMPT[options.styleOverride ?? video.style] ?? '';
  const basePrompt = options.promptOverride ?? scene.image_prompt ?? scene.visual_description;
  const prompt = `${basePrompt}. Style: ${style}. Educational material for Thai students. No text, no watermark.`;

  const provider = getImageProvider();
  const started = Date.now();

  try {
    const image = await provider.generate({
      prompt,
      aspectRatio: video.aspect_ratio,
      quality: video.resolution === '1080p' ? 'high' : 'standard',
    });

    const uploaded = await uploadGenerated(service, {
      bucket: 'scene-images',
      ownerId: video.owner_id,
      videoId: video.id,
      sceneId: scene.id,
      fileName: `scene-${scene.index + 1}-${Date.now()}.png`,
      bytes: image.bytes,
      contentType: image.mimeType,
      provider: provider.name,
    });

    const { data } = await service
      .from('scenes')
      .update({
        image_url: uploaded.publicUrl,
        image_status: 'ready',
        image_prompt: options.promptOverride ?? scene.image_prompt ?? basePrompt,
      })
      .eq('id', scene.id)
      .select('*')
      .single();

    await logAiUsage(service, {
      userId: video.owner_id,
      videoId: video.id,
      action: 'image',
      provider: provider.name,
      model: image.model,
      latencyMs: Date.now() - started,
    });

    return data as SceneRecord;
  } catch (error) {
    await service.from('scenes').update({ image_status: 'failed' }).eq('id', scene.id);
    await logAiUsage(service, {
      userId: video.owner_id,
      videoId: video.id,
      action: 'image',
      provider: providerNames().image,
      latencyMs: Date.now() - started,
      success: false,
    });

    throw error;
  }
};

export const runAllImages = async (service: SupabaseClient, video: VideoRecord) => {
  const scenes = await loadScenes(service, video.id);
  const pending = scenes.filter((scene) => scene.image_status !== 'ready');
  let completed = 0;

  // ทำทีละภาพเพื่อไม่ให้ชน rate limit ของผู้ให้บริการ
  for (const scene of pending) {
    try {
      await runSceneImage(service, video, scene);
      completed += 1;
    } catch (error) {
      console.error(`[images] ฉากที่ ${scene.index + 1} ไม่สำเร็จ`, error);
    }
  }

  if (completed === 0 && pending.length > 0) {
    throw new HttpError('IMAGE_GENERATION_FAILED', 'ระบบสร้างภาพไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  return completed;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 6 — เสียงบรรยาย
// ---------------------------------------------------------------------------
const resolveProviderVoice = async (
  service: SupabaseClient,
  voiceId: string | null,
  providerName: string,
) => {
  const fallback = providerName === 'openai' ? 'nova' : 'th-TH-Neural2-A';

  if (!voiceId) {
    return fallback;
  }

  const { data } = await service.from('voices').select('provider_voice').eq('id', voiceId).maybeSingle();
  const map = (data as { provider_voice: Record<string, string> } | null)?.provider_voice ?? {};

  return map[providerName] ?? fallback;
};

export const runSceneVoice = async (
  service: SupabaseClient,
  video: VideoRecord,
  scene: SceneRecord,
) => {
  await spendCreditsFor(service, video.owner_id, 'voice', 1, video.id);
  await service.from('scenes').update({ audio_status: 'generating' }).eq('id', scene.id);

  const provider = getSpeechProvider();
  const started = Date.now();

  try {
    const voice = await resolveProviderVoice(service, video.voice_id, provider.name);
    const audio = await provider.synthesize({
      text: scene.narration,
      voice,
      language: video.subtitle_language ?? 'th',
      speed: Number(video.voice_speed ?? 1),
      pitch: Number(video.voice_pitch ?? 0),
      volume: Number(video.voice_volume ?? 1),
    });

    const uploaded = await uploadGenerated(service, {
      bucket: 'scene-audio',
      ownerId: video.owner_id,
      videoId: video.id,
      sceneId: scene.id,
      fileName: `scene-${scene.index + 1}-${Date.now()}.mp3`,
      bytes: audio.bytes,
      contentType: audio.mimeType,
      provider: provider.name,
    });

    await service
      .from('scenes')
      .update({
        audio_url: uploaded.publicUrl,
        audio_status: 'ready',
        audio_duration_sec: audio.durationSec,
      })
      .eq('id', scene.id);

    await logAiUsage(service, {
      userId: video.owner_id,
      videoId: video.id,
      action: 'voice',
      provider: provider.name,
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    await service.from('scenes').update({ audio_status: 'failed' }).eq('id', scene.id);
    throw error;
  }
};

export const runAllVoices = async (service: SupabaseClient, video: VideoRecord) => {
  const scenes = await loadScenes(service, video.id);
  const pending = scenes.filter((scene) => scene.audio_status !== 'ready' && scene.narration.trim());
  let completed = 0;

  for (const scene of pending) {
    try {
      await runSceneVoice(service, video, scene);
      completed += 1;
    } catch (error) {
      console.error(`[voice] ฉากที่ ${scene.index + 1} ไม่สำเร็จ`, error);
    }
  }

  if (completed === 0 && pending.length > 0) {
    throw new HttpError('VOICE_GENERATION_FAILED', 'ระบบสร้างเสียงบรรยายไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  return completed;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 7 — Subtitle
// ---------------------------------------------------------------------------
export const runSubtitles = async (service: SupabaseClient, video: VideoRecord) => {
  await spendCreditsFor(service, video.owner_id, 'subtitles', 1, video.id);

  const scenes = await loadScenes(service, video.id);
  const provider = getTextProvider();

  const result = await provider.complete({
    system: systemPrompt(),
    prompt: subtitlePrompt(scenes.map((scene) => scene.narration), video.subtitle_language ?? 'th'),
    json: true,
    temperature: 0.3,
    maxTokens: 6000,
  });

  const parsed = parseJsonResponse<{
    cues: { scene_index: number; text_th: string; text_en?: string; keywords?: string[] }[];
  }>(result.text);

  await service.from('subtitle_cues').delete().eq('video_id', video.id);

  // แบ่งเวลาของแต่ละฉากให้บรรทัด Subtitle ที่อยู่ในฉากนั้นอย่างเท่า ๆ กัน
  const bySceneIndex = new Map<number, typeof parsed.cues>();

  for (const cue of parsed.cues ?? []) {
    const list = bySceneIndex.get(cue.scene_index) ?? [];
    list.push(cue);
    bySceneIndex.set(cue.scene_index, list);
  }

  const rows: Record<string, unknown>[] = [];
  let cueIndex = 0;

  for (const scene of scenes) {
    const cues = bySceneIndex.get(scene.index) ?? [];

    if (!cues.length) {
      continue;
    }

    const sceneLength = Math.max(1, scene.end_sec - scene.start_sec);
    const slice = sceneLength / cues.length;

    cues.forEach((cue, position) => {
      rows.push({
        video_id: video.id,
        scene_id: scene.id,
        index: cueIndex,
        start_sec: scene.start_sec + position * slice,
        end_sec: scene.start_sec + (position + 1) * slice,
        text_th: cue.text_th,
        text_en: cue.text_en ?? null,
        keywords: cue.keywords ?? [],
      });
      cueIndex += 1;
    });
  }

  if (rows.length) {
    const { error } = await service.from('subtitle_cues').insert(rows);

    if (error) {
      throw new HttpError('UNKNOWN', `บันทึก Subtitle ไม่สำเร็จ: ${error.message}`);
    }
  }

  return rows.length;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 8 — ประกอบเป็นวิดีโอ
// ---------------------------------------------------------------------------
export const runRender = async (service: SupabaseClient, video: VideoRecord) => {
  await spendCreditsFor(service, video.owner_id, 'render', 1, video.id);

  const scenes = await loadScenes(service, video.id);
  const ready = scenes.filter((scene) => scene.image_url);

  if (!ready.length) {
    throw new HttpError('VALIDATION_ERROR', 'ยังไม่มีภาพประกอบ กรุณาสร้างภาพก่อนประกอบวิดีโอ');
  }

  const { data: cues } = await service
    .from('subtitle_cues')
    .select('start_sec, end_sec, text_th, text_en')
    .eq('video_id', video.id)
    .order('index', { ascending: true });

  let musicUrl: string | null = null;

  if (video.music_id) {
    const { data: track } = await service
      .from('music_tracks')
      .select('storage_path, preview_url')
      .eq('id', video.music_id)
      .maybeSingle();

    const path = (track as { storage_path: string | null } | null)?.storage_path;

    if (path) {
      musicUrl = service.storage.from('music').getPublicUrl(path.replace(/^music\//, '')).data.publicUrl;
    }
  }

  const provider = getVideoProvider();
  const handle = await provider.render({
    clips: ready.map((scene) => ({
      imageUrl: scene.image_url!,
      audioUrl: scene.audio_url,
      startSec: scene.start_sec,
      endSec: scene.end_sec,
      onScreenText: scene.on_screen_text,
      transition: scene.transition,
    })),
    subtitles: video.subtitle_enabled
      ? ((cues ?? []) as { start_sec: number; end_sec: number; text_th: string; text_en: string | null }[]).map(
          (cue) => ({
            startSec: Number(cue.start_sec),
            endSec: Number(cue.end_sec),
            text: video.subtitle_language === 'en' ? (cue.text_en ?? cue.text_th) : cue.text_th,
          }),
        )
      : [],
    subtitleStyle: video.subtitle_style,
    subtitleFont: video.subtitle_font,
    subtitleSize: video.subtitle_size,
    musicUrl,
    aspectRatio: video.aspect_ratio,
    resolution: video.resolution,
    watermark: video.watermarked,
    logoUrl: video.school_logo_url,
    callbackUrl: null,
  });

  return handle.providerJobId;
};

/** ตรวจสถานะงาน render ที่ส่งไปให้ provider แล้ว */
export const pollRender = async (service: SupabaseClient, video: VideoRecord, providerJobId: string) => {
  const provider = getVideoProvider();
  const status = await provider.poll(providerJobId);

  if (status.status === 'done' && status.url) {
    await service
      .from('videos')
      .update({
        video_url: status.url,
        status: 'quality_check',
        progress: 96,
        completed_at: new Date().toISOString(),
      })
      .eq('id', video.id);
  }

  return status;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 9 — ตรวจสอบคุณภาพ
// ---------------------------------------------------------------------------
export interface QualityReport {
  score: number;
  checks: { key: string; label: string; passed: boolean; detail: string }[];
  suggestions: string[];
}

export const runQuality = async (service: SupabaseClient, video: VideoRecord): Promise<QualityReport> => {
  await spendCreditsFor(service, video.owner_id, 'quality', 1, video.id);

  const scenes = await loadScenes(service, video.id);
  const { count: subtitleCount } = await service
    .from('subtitle_cues')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', video.id);

  const provider = getTextProvider();
  const result = await provider.complete({
    system: systemPrompt(),
    prompt: qualityPrompt(toLessonContext(video), {
      sceneCount: scenes.length,
      totalSeconds: scenes.reduce((max, scene) => Math.max(max, scene.end_sec), 0),
      imagesReady: scenes.filter((scene) => scene.image_status === 'ready').length,
      audioReady: scenes.filter((scene) => scene.audio_status === 'ready').length,
      subtitleCount: subtitleCount ?? 0,
      narrations: scenes.map((scene) => scene.narration),
    }),
    json: true,
    temperature: 0.3,
    maxTokens: 2500,
  });

  const report = parseJsonResponse<QualityReport>(result.text);
  report.score = Math.max(0, Math.min(100, Math.round(report.score ?? 0)));

  await service.from('quality_reports').insert({ video_id: video.id, score: report.score, report });
  await service.from('videos').update({ quality_score: report.score }).eq('id', video.id);

  return report;
};

// ---------------------------------------------------------------------------
// ขั้นที่ 10 — Thumbnail
// ---------------------------------------------------------------------------
export interface ThumbnailOption {
  id: string;
  headline: string;
  url: string;
}

export const runThumbnails = async (
  service: SupabaseClient,
  video: VideoRecord,
): Promise<ThumbnailOption[]> => {
  await spendCreditsFor(service, video.owner_id, 'thumbnail', 1, video.id);

  const textProvider = getTextProvider();
  const result = await textProvider.complete({
    system: systemPrompt(),
    prompt: thumbnailPrompt(toLessonContext(video)),
    json: true,
    temperature: 0.9,
    maxTokens: 1500,
  });

  const parsed = parseJsonResponse<{ options: { headline: string; image_prompt: string }[] }>(result.text);
  const imageProvider = getImageProvider();
  const options: ThumbnailOption[] = [];

  for (const [index, option] of (parsed.options ?? []).slice(0, 3).entries()) {
    try {
      const image = await imageProvider.generate({
        prompt: `${option.image_prompt}. ${STYLE_PROMPT[video.style] ?? ''}. Eye-catching educational video thumbnail. No text, no watermark.`,
        aspectRatio: video.aspect_ratio,
        quality: 'standard',
      });

      const uploaded = await uploadGenerated(service, {
        bucket: 'thumbnails',
        ownerId: video.owner_id,
        videoId: video.id,
        fileName: `thumb-${index + 1}-${Date.now()}.png`,
        bytes: image.bytes,
        contentType: image.mimeType,
        provider: imageProvider.name,
      });

      options.push({ id: `${index + 1}`, headline: option.headline, url: uploaded.publicUrl });
    } catch (error) {
      console.error('[thumbnail] สร้างไม่สำเร็จ', error);
    }
  }

  if (!options.length) {
    throw new HttpError('IMAGE_GENERATION_FAILED', 'สร้าง Thumbnail ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  // เลือกแบบแรกไว้ก่อนเพื่อให้วิดีโอมีปกเสมอ ครูเปลี่ยนได้ภายหลัง
  if (!video.school_logo_url) {
    await service.from('videos').update({ thumbnail_url: options[0].url }).eq('id', video.id);
  }

  return options;
};

// ---------------------------------------------------------------------------
// ฟีเจอร์พรีเมียม — ชุดสื่อการสอนครบชุด
// ---------------------------------------------------------------------------
export const runLessonKit = async (service: SupabaseClient, video: VideoRecord, kitId: string) => {
  const scenes = await loadScenes(service, video.id);
  const provider = getTextProvider();

  try {
    const result = await provider.complete({
      system: systemPrompt(),
      prompt: lessonKitPrompt(toLessonContext(video), scenes.map((scene) => scene.narration)),
      json: true,
      temperature: 0.6,
      maxTokens: 12000,
    });

    const parsed = parseJsonResponse<{
      lesson_plan: string;
      slides_outline: string;
      worksheet: string;
      quiz: string;
      handout: string;
    }>(result.text);

    await service
      .from('lesson_kits')
      .update({
        status: 'ready',
        lesson_plan: parsed.lesson_plan,
        slides_outline: parsed.slides_outline,
        worksheet: parsed.worksheet,
        quiz: parsed.quiz,
        handout: parsed.handout,
      })
      .eq('id', kitId);

    await logAiUsage(service, {
      userId: video.owner_id,
      videoId: video.id,
      action: 'lesson_kit',
      provider: provider.name,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
  } catch (error) {
    await service.from('lesson_kits').update({ status: 'failed' }).eq('id', kitId);
    throw error;
  }
};
