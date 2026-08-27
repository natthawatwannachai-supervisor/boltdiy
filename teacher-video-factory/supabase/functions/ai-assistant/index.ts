import { json, readBody, requireString, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { spendCredits } from '../_shared/credits.ts';
import { parseJsonResponse } from '../_shared/json.ts';
import { getTextProvider } from '../_shared/ai/registry.ts';
import { assistantSystemPrompt } from '../_shared/prompts.ts';
import { loadScenes, toLessonContextSafe } from '../_shared/assistant-context.ts';

interface Body {
  thread_id?: string | null;
  video_id?: string | null;
  message: string;
}

interface AssistantOutput {
  reply: string;
  artifact: Record<string, unknown> | null;
  action: { type: 'create_video'; prompt: string } | null;
}

/** น้อง Teacher AI — ตอบคำถามครูและสร้างสื่อประกอบ เช่น แบบทดสอบ ใบงาน กิจกรรม */
Deno.serve(
  serveJson(async (req) => {
    const { user, client } = await requireUser(req);
    const body = await readBody<Body>(req);
    const message = requireString(body.message, 'message');

    await spendCredits(client, 'assistant', 1, body.video_id ?? null);

    const service = serviceClient();
    let threadId = body.thread_id ?? null;

    if (!threadId) {
      const { data } = await service
        .from('assistant_threads')
        .insert({
          owner_id: user.id,
          video_id: body.video_id ?? null,
          title: message.slice(0, 60),
        })
        .select('id')
        .single();

      threadId = (data as { id: string }).id;
    }

    await service.from('assistant_messages').insert({
      thread_id: threadId,
      role: 'user',
      content: message,
    });

    // ส่งประวัติล่าสุดไปด้วยเพื่อให้ AI จำบริบทการสนทนาได้
    const { data: history } = await service
      .from('assistant_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(10);

    const transcript = ((history ?? []) as { role: string; content: string }[])
      .reverse()
      .map((item) => `${item.role === 'user' ? 'ครู' : 'น้อง Teacher AI'}: ${item.content}`)
      .join('\n');

    const context = await toLessonContextSafe(service, body.video_id ?? null);
    const sceneNotes = body.video_id ? await loadScenes(service, body.video_id) : [];

    const provider = getTextProvider();
    const result = await provider.complete({
      system: assistantSystemPrompt(),
      prompt: [
        context ? `บริบทวิดีโอที่ครูกำลังทำอยู่:\n${context}` : '',
        sceneNotes.length
          ? `บทวิดีโอปัจจุบัน:\n${sceneNotes.map((s, i) => `[ฉาก ${i + 1}] ${s}`).join('\n')}`
          : '',
        `บทสนทนาล่าสุด:\n${transcript}`,
        `คำถามล่าสุดของครู: ${message}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      json: true,
      temperature: 0.7,
      maxTokens: 4000,
    });

    const parsed = parseJsonResponse<AssistantOutput>(result.text);

    const { data: saved } = await service
      .from('assistant_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: parsed.reply,
        artifact: parsed.artifact,
      })
      .select('*')
      .single();

    await service
      .from('assistant_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    return json({ thread_id: threadId, message: saved, action: parsed.action ?? undefined });
  }),
);
