import { json, serveJson } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { refundCredits } from '../_shared/credits.ts';
import { notifyUser } from '../_shared/notify.ts';
import {
  cancelPendingJobs,
  failVideo,
  updateVideoStage,
  type JobStage,
} from '../_shared/queue.ts';
import {
  loadVideo,
  pollRender,
  runAllImages,
  runAllVoices,
  runObjectives,
  runQuality,
  runRender,
  runScript,
  runStoryboard,
  runSubtitles,
  runThumbnails,
} from '../_shared/pipeline.ts';
import type { VideoRecord } from '../_shared/lesson.ts';

interface JobRow {
  id: string;
  video_id: string;
  owner_id: string;
  stage: JobStage;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
}

/** ค่าเครดิตที่ต้องคืนเมื่อขั้นตอนนั้นล้มเหลวถาวร */
const REFUND_BY_STAGE: Partial<Record<JobStage, number>> = {
  objectives: 1,
  script: 1,
  storyboard: 1,
  subtitles: 1,
  render: 5,
  quality: 1,
  thumbnail: 2,
};

const MAX_JOBS_PER_RUN = 4;
const POLL_DELAY_MS = 20_000;

const runStage = async (
  service: ReturnType<typeof serviceClient>,
  job: JobRow,
  video: VideoRecord,
): Promise<'done' | 'poll'> => {
  switch (job.stage) {
    case 'objectives':
      await runObjectives(service, video);
      return 'done';
    case 'script':
      await runScript(service, video);
      return 'done';
    case 'storyboard':
      await runStoryboard(service, video);
      return 'done';
    case 'images':
      await runAllImages(service, video);
      return 'done';
    case 'voice':
      await runAllVoices(service, video);
      return 'done';
    case 'subtitles':
      await runSubtitles(service, video);
      return 'done';
    case 'quality':
      await runQuality(service, video);
      return 'done';
    case 'thumbnail':
      await runThumbnails(service, video);
      return 'done';
    case 'render': {
      const existingId = job.payload.provider_job_id as string | undefined;

      if (!existingId) {
        const providerJobId = await runRender(service, video);

        await service
          .from('jobs')
          .update({ payload: { ...job.payload, provider_job_id: providerJobId } })
          .eq('id', job.id);

        return 'poll';
      }

      const status = await pollRender(service, video, existingId);

      if (status.status === 'done') {
        return 'done';
      }

      if (status.status === 'failed') {
        throw new Error(status.error ?? 'ประกอบวิดีโอไม่สำเร็จ');
      }

      return 'poll';
    }
    default:
      return 'done';
  }
};

const finishVideoIfComplete = async (
  service: ReturnType<typeof serviceClient>,
  videoId: string,
) => {
  const { count } = await service
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', videoId)
    .in('status', ['queued', 'running']);

  if ((count ?? 0) > 0) {
    return;
  }

  const video = await loadVideo(service, videoId);

  if (!video.video_url) {
    return;
  }

  await service
    .from('videos')
    .update({ status: 'completed', progress: 100, completed_at: new Date().toISOString() })
    .eq('id', videoId);

  await notifyUser(service, {
    userId: video.owner_id,
    title: `🎬 วิดีโอ “${video.title}” สร้างเสร็จแล้ว`,
    body: 'พร้อมดาวน์โหลดและแชร์เข้าห้องเรียนของคุณได้ทันที',
    kind: 'video_ready',
    videoId,
  });
};

/**
 * ตัวประมวลผลคิวงาน — ตั้งเวลาเรียกทุก 1 นาทีด้วย pg_cron + pg_net
 * ทำงานทีละงานเพื่อให้ retry และการคืนเครดิตควบคุมได้ชัดเจน
 */
Deno.serve(
  serveJson(async (req) => {
    const secret = Deno.env.get('JOB_WORKER_SECRET');

    if (secret && req.headers.get('x-worker-secret') !== secret) {
      return json({ error: { code: 'UNAUTHORIZED', message: 'ไม่มีสิทธิ์เรียกใช้ worker' } }, 401);
    }

    const service = serviceClient();
    const processed: { job: string; stage: string; result: string }[] = [];

    for (let i = 0; i < MAX_JOBS_PER_RUN; i += 1) {
      const { data, error } = await service.rpc('claim_next_job');

      if (error) {
        console.error('[worker] หยิบงานไม่สำเร็จ', error.message);
        break;
      }

      const job = data as JobRow | null;

      if (!job?.id) {
        break;
      }

      try {
        const video = await loadVideo(service, job.video_id);
        await updateVideoStage(service, job.video_id, job.stage);

        const outcome = await runStage(service, job, video);

        if (outcome === 'poll') {
          // งาน render ยังไม่เสร็จ — คืนงานเข้าคิวเพื่อมาตรวจสถานะอีกครั้ง
          // และคืนค่า attempts เพราะรอบนี้ไม่ใช่ความล้มเหลว
          await service
            .from('jobs')
            .update({
              status: 'queued',
              attempts: Math.max(0, job.attempts - 1),
              scheduled_at: new Date(Date.now() + POLL_DELAY_MS).toISOString(),
            })
            .eq('id', job.id);

          processed.push({ job: job.id, stage: job.stage, result: 'polling' });
          continue;
        }

        await service
          .from('jobs')
          .update({ status: 'succeeded', progress: 100, finished_at: new Date().toISOString() })
          .eq('id', job.id);

        await finishVideoIfComplete(service, job.video_id);
        processed.push({ job: job.id, stage: job.stage, result: 'succeeded' });
      } catch (stageError) {
        const message = stageError instanceof Error ? stageError.message : 'เกิดข้อผิดพลาด';
        const canRetry = job.attempts < job.max_attempts;

        if (canRetry) {
          // หน่วงแบบ exponential ก่อนลองใหม่ (สเปกข้อ 38: retry อย่างน้อย 2 ครั้ง)
          await service
            .from('jobs')
            .update({
              status: 'queued',
              error_message: message,
              scheduled_at: new Date(Date.now() + 30_000 * 2 ** (job.attempts - 1)).toISOString(),
            })
            .eq('id', job.id);

          processed.push({ job: job.id, stage: job.stage, result: `retry (${job.attempts})` });
          continue;
        }

        await service
          .from('jobs')
          .update({ status: 'failed', error_message: message, finished_at: new Date().toISOString() })
          .eq('id', job.id);

        await cancelPendingJobs(service, job.video_id);
        await failVideo(service, job.video_id, message);

        const refund = REFUND_BY_STAGE[job.stage];

        if (refund) {
          await refundCredits(
            service,
            job.owner_id,
            refund,
            `คืนเครดิตจากขั้นตอนที่ไม่สำเร็จ (${job.stage})`,
            job.video_id,
          );
        }

        await notifyUser(service, {
          userId: job.owner_id,
          title: '⚠️ สร้างวิดีโอไม่สำเร็จ',
          body: 'ระบบคืนเครดิตให้แล้ว คุณสามารถกดลองใหม่ได้จากหน้าวิดีโอ',
          kind: 'system',
          videoId: job.video_id,
        });

        processed.push({ job: job.id, stage: job.stage, result: 'failed' });
      }
    }

    return json({ processed, count: processed.length });
  }),
);
