import { HttpError, json, readBody, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { AUTO_PILOT_STAGES, enqueueStages } from '../_shared/queue.ts';

interface Body {
  brief: {
    topic: string;
    grade_level: string;
    subject: string;
    duration_min: number;
    format: string;
    style: string;
  };
  title?: string;
  project_id?: string | null;
  template_id?: string | null;
  auto_pilot: boolean;
}

/**
 * สร้างวิดีโอใหม่ พร้อมตรวจโควตาของแพ็กเกจ
 * ถ้าเลือก auto pilot จะเข้าคิวงานทุกขั้นให้ทำงานเบื้องหลังทันที
 */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const body = await readBody<Body>(req);

    if (!body.brief?.topic?.trim()) {
      throw new HttpError('VALIDATION_ERROR', 'กรุณาระบุหัวข้อบทเรียน');
    }

    const service = serviceClient();

    const { data: subscription } = await service
      .from('subscriptions')
      .select('plan, videos_used_this_period, current_period_end')
      .eq('user_id', user.id)
      .single();

    const { data: plan } = await service
      .from('plans')
      .select('*')
      .eq('key', subscription?.plan ?? 'free')
      .single();

    if (!plan) {
      throw new HttpError('UNKNOWN', 'ไม่พบข้อมูลแพ็กเกจ');
    }

    if ((subscription?.videos_used_this_period ?? 0) >= plan.videos_per_month) {
      throw new HttpError(
        'PLAN_LIMIT_VIDEOS',
        `แพ็กเกจ ${plan.name} สร้างได้ ${plan.videos_per_month} วิดีโอต่อเดือน และคุณใช้ครบแล้ว`,
        { limit: plan.videos_per_month },
      );
    }

    if (body.brief.duration_min > plan.max_duration_min) {
      throw new HttpError(
        'PLAN_LIMIT_DURATION',
        `แพ็กเกจ ${plan.name} สร้างวิดีโอได้สูงสุด ${plan.max_duration_min} นาที`,
        { limit: plan.max_duration_min },
      );
    }

    const { data: video, error } = await service
      .from('videos')
      .insert({
        owner_id: user.id,
        project_id: body.project_id ?? null,
        template_id: body.template_id ?? null,
        title: (body.title ?? body.brief.topic).slice(0, 120),
        topic: body.brief.topic.trim(),
        grade_level: body.brief.grade_level,
        subject: body.brief.subject,
        duration_min: body.brief.duration_min,
        format: body.brief.format,
        style: body.brief.style,
        aspect_ratio: body.brief.format === 'short' ? '9:16' : '16:9',
        resolution: plan.max_resolution,
        watermarked: plan.watermark,
        status: body.auto_pilot ? 'analyzing' : 'draft',
        progress: body.auto_pilot ? 5 : 0,
        auto_pilot: body.auto_pilot,
      })
      .select('*')
      .single();

    if (error || !video) {
      throw new HttpError('UNKNOWN', `สร้างวิดีโอไม่สำเร็จ: ${error?.message}`);
    }

    await service
      .from('subscriptions')
      .update({ videos_used_this_period: (subscription?.videos_used_this_period ?? 0) + 1 })
      .eq('user_id', user.id);

    if (body.template_id) {
      await service.rpc('increment_template_usage', { p_template_id: body.template_id }).then(
        () => undefined,
        () => undefined,
      );
    }

    if (body.auto_pilot) {
      await enqueueStages(service, {
        videoId: video.id,
        ownerId: user.id,
        stages: AUTO_PILOT_STAGES,
      });
    }

    return json({ video });
  }),
);
