import { readBody, requireString, serveJson, json } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { spendCredits } from '../_shared/credits.ts';
import { runAnalyze } from '../_shared/pipeline.ts';

/**
 * ขั้นแรกของ One Prompt → Full Video
 * รับประโยคเดียวของครูแล้วแปลงเป็นข้อมูลบทเรียนที่มีโครงสร้าง
 */
Deno.serve(
  serveJson(async (req) => {
    const { user, client } = await requireUser(req);
    const body = await readBody<{ prompt: string }>(req);
    const prompt = requireString(body.prompt, 'หัวข้อบทเรียน');

    await spendCredits(client, 'analyze', 1, null);

    const service = serviceClient();
    const analysis = await runAnalyze(service, user.id, prompt);

    return json({
      brief: {
        topic: analysis.topic,
        grade_level: analysis.grade_level,
        subject: analysis.subject,
        duration_min: analysis.duration_min,
        format: analysis.format,
        style: analysis.style,
      },
      detected: analysis.detected ?? [],
      suggested_title: analysis.suggested_title ?? analysis.topic,
    });
  }),
);
