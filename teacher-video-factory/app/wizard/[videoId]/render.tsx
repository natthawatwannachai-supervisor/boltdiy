import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  AIThinking,
  Badge,
  Button,
  Card,
  ErrorState,
  GradientHeader,
  LoadingState,
  ProgressBar,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { generateSubtitles, generateVoiceOver, renderVideo } from '@/lib/api/ai';
import { listJobs } from '@/lib/api/videos';
import { useScenes, useVideo } from '@/hooks/useVideo';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { JOB_STAGE_LABEL, JOB_STAGE_ORDER } from '@/i18n/th';
import { musicById, voiceById } from '@/constants/media';
import { formatTimecode } from '@/utils/format';

const ACTIVE_STATUSES = new Set([
  'generating_voice',
  'generating_subtitles',
  'rendering',
  'quality_check',
]);

/** ขั้นตอนที่ 6: ประกอบภาพ + เสียง + Subtitle + เพลง เป็นไฟล์วิดีโอจริง */
export default function RenderStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const video = useVideo(videoId);
  const scenes = useScenes(videoId);

  const rendering = video.data ? ACTIVE_STATUSES.has(video.data.status) : false;

  const jobs = useQuery({
    queryKey: queryKeys.jobs(videoId),
    queryFn: () => listJobs(videoId),
    refetchInterval: rendering ? 5000 : false,
  });

  const start = useMutation({
    mutationFn: async () => {
      const sceneCount = scenes.data?.length ?? 0;

      // เสียงคิดตามจำนวนฉาก ส่วน subtitle และการ render คิดครั้งเดียว
      const voiceResult = await guard.run('voice', sceneCount, () => generateVoiceOver(videoId));

      if (!voiceResult) {
        throw new Error('__handled__');
      }

      await generateSubtitles({
        video_id: videoId,
        language: video.data?.subtitle_language ?? 'th',
        style: video.data?.subtitle_style ?? 'bottom',
      });

      const renderResult = await guard.run('render', 1, () => renderVideo(videoId));

      if (!renderResult) {
        throw new Error('__handled__');
      }

      return renderResult;
    },
    onSuccess: () => {
      track('video_render_started', { video_id: videoId });
      toast.success('เริ่มสร้างวิดีโอแล้ว คุณปิดแอปได้เลย เราจะแจ้งเตือนเมื่อเสร็จ');
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  useEffect(() => {
    if (video.data?.status === 'completed') {
      router.replace(`/video/${videoId}`);
    }
  }, [video.data?.status, videoId]);

  const stageState = useMemo(() => {
    const byStage = new Map((jobs.data ?? []).map((job) => [job.stage, job]));

    return JOB_STAGE_ORDER.map((stage) => ({
      stage,
      label: JOB_STAGE_LABEL[stage],
      status: byStage.get(stage)?.status ?? 'queued',
    }));
  }, [jobs.data]);

  if (video.isLoading || scenes.isLoading) {
    return <LoadingState message="กำลังเตรียมสายพานผลิต…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const totalSeconds = scenes.data?.reduce((max, scene) => Math.max(max, scene.end_sec), 0) ?? 0;
  const imagesReady = scenes.data?.filter((s) => s.image_status === 'ready').length ?? 0;
  const audioReady = scenes.data?.filter((s) => s.audio_status === 'ready').length ?? 0;
  const sceneCount = scenes.data?.length ?? 0;

  return (
    <View style={styles.flex}>
      <GradientHeader title="ประกอบวิดีโอ" subtitle="ขั้นตอนที่ 6 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={5} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Text variant="h3">Timeline</Text>
            <Badge label={formatTimecode(totalSeconds)} tone="primary" />
          </View>

          <TimelineTrack
            icon="image-outline"
            label="IMAGE"
            detail={`${imagesReady}/${sceneCount} ภาพพร้อม`}
            ratio={sceneCount ? imagesReady / sceneCount : 0}
          />
          <TimelineTrack
            icon="mic-outline"
            label="VOICE"
            detail={voiceById(video.data.voice_id)?.label ?? 'ยังไม่ได้เลือกเสียง'}
            ratio={sceneCount ? audioReady / sceneCount : 0}
          />
          <TimelineTrack
            icon="text-outline"
            label="TEXT"
            detail={video.data.subtitle_enabled ? `Subtitle ${video.data.subtitle_language.toUpperCase()}` : 'ปิด Subtitle'}
            ratio={video.data.subtitle_enabled ? 1 : 0}
          />
          <TimelineTrack
            icon="musical-notes-outline"
            label="MUSIC"
            detail={musicById(video.data.music_id)?.label ?? 'ไม่ใส่เพลง'}
            ratio={video.data.music_id ? 1 : 0}
          />
        </Card>

        {rendering ? (
          <Card style={styles.progressCard}>
            <AIThinking
              message="🤖 AI กำลังตัดต่อวิดีโอให้คุณ…"
              hint="ออกจากแอปได้เลย เมื่อเสร็จเราจะส่งการแจ้งเตือนให้ทันที"
            />
            <Text variant="h2" center color={colors.primary}>
              กำลังสร้างวิดีโอ {Math.round(video.data.progress)}%
            </Text>
            <ProgressBar value={video.data.progress} height={12} />

            <View style={styles.stages}>
              {stageState.map((item) => (
                <View key={item.stage} style={styles.stageRow}>
                  <Ionicons
                    name={
                      item.status === 'succeeded'
                        ? 'checkmark-circle'
                        : item.status === 'running'
                          ? 'sync-circle'
                          : item.status === 'failed'
                            ? 'close-circle'
                            : 'ellipse-outline'
                    }
                    size={18}
                    color={
                      item.status === 'succeeded'
                        ? colors.success
                        : item.status === 'running'
                          ? colors.accent
                          : item.status === 'failed'
                            ? colors.danger
                            : colors.textMuted
                    }
                  />
                  <Text
                    variant="small"
                    color={item.status === 'queued' ? colors.textMuted : colors.text}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <Button label="กลับไปหน้าหลัก" variant="ghost" onPress={() => router.replace('/(tabs)')} />
          </Card>
        ) : video.data.status === 'failed' ? (
          <ErrorState
            title="สร้างวิดีโอไม่สำเร็จ"
            message={video.data.error_message ?? 'ระบบประกอบวิดีโอไม่สำเร็จ กรุณาลองอีกครั้ง'}
            onRetry={() => start.mutate()}
            actionLabel="ลองสร้างใหม่"
          />
        ) : (
          <View style={styles.actions}>
            <Card tone="outlined" style={styles.checklist}>
              <Text variant="bodyStrong">ก่อนเริ่มสร้าง</Text>
              <ChecklistRow ok={imagesReady === sceneCount && sceneCount > 0} label={`ภาพประกอบครบ ${imagesReady}/${sceneCount} ฉาก`} />
              <ChecklistRow ok={Boolean(video.data.voice_id)} label="เลือกเสียงบรรยายแล้ว" />
              <ChecklistRow ok={sceneCount > 0} label="มีบทวิดีโอและการแบ่งฉาก" />
            </Card>

            <Button
              label="🎬 สร้างวิดีโอ"
              size="lg"
              variant="ai"
              loading={start.isPending}
              disabled={sceneCount === 0 || !video.data.voice_id}
              onPress={() => start.mutate()}
            />
            <Text variant="caption" color={colors.textMuted} center>
              ระบบจะสร้างเสียงบรรยาย Subtitle แล้วประกอบเป็นไฟล์ MP4 ให้อัตโนมัติ
            </Text>
          </View>
        )}
      </ScrollView>

      <InsufficientCreditsSheet
        visible={guard.visible}
        required={guard.required}
        balance={guard.balance}
        action={guard.action}
        onClose={guard.dismiss}
      />
    </View>
  );
}

function TimelineTrack({
  icon,
  label,
  detail,
  ratio,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  ratio: number;
}) {
  return (
    <View style={styles.track}>
      <View style={styles.trackHeader}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text variant="caption" color={colors.textSecondary} style={styles.trackLabel}>
          {label}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {detail}
        </Text>
      </View>
      <View style={styles.trackBar}>
        <View style={[styles.trackFill, { width: `${Math.min(100, ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

function ChecklistRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'alert-circle-outline'}
        size={18}
        color={ok ? colors.success : colors.warning}
      />
      <Text variant="small" color={ok ? colors.text : colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  timelineCard: { gap: spacing.md },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { gap: 6 },
  trackHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trackLabel: { fontWeight: '700', letterSpacing: 1 },
  trackBar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  progressCard: { gap: spacing.md },
  stages: { gap: spacing.sm, marginTop: spacing.sm },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { gap: spacing.md },
  checklist: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
