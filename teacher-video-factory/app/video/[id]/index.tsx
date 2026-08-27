import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  AIThinking,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  GradientHeader,
  LoadingState,
  ProgressBar,
  Sheet,
  Text,
  useToast,
} from '@/components/ui';
import { PaywallSheet } from '@/components/domain/PaywallSheet';
import { generateThumbnails, selectThumbnail, type ThumbnailOption } from '@/lib/api/ai';
import { deleteVideo } from '@/lib/api/videos';
import { createTemplateFromVideo } from '@/lib/api/templates';
import { useVideo } from '@/hooks/useVideo';
import { usePlan } from '@/hooks/usePlan';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { VIDEO_STATUS_LABEL } from '@/i18n/th';
import { gradeLabel, subjectLabel, formatLabel, styleLabel } from '@/constants/lesson';
import { formatDuration, formatThaiDate } from '@/utils/format';

const IN_PROGRESS = new Set([
  'analyzing',
  'scripting',
  'storyboarding',
  'generating_images',
  'generating_voice',
  'generating_subtitles',
  'rendering',
  'quality_check',
]);

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canUseLessonKit, nextPlan } = usePlan();
  const video = useVideo(id);

  const [thumbnails, setThumbnails] = useState<ThumbnailOption[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const player = useVideoPlayer(video.data?.video_url ?? null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    if (video.data?.status === 'completed') {
      track('video_completed', { video_id: id });
    }
  }, [id, video.data?.status]);

  const makeThumbnails = useMutation({
    mutationFn: () => generateThumbnails(id),
    onSuccess: (result) => setThumbnails(result.options),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const pickThumbnail = useMutation({
    mutationFn: (thumbnailId: string) => selectThumbnail(id, thumbnailId),
    onSuccess: async () => {
      setThumbnails(null);
      toast.success('เปลี่ยน Thumbnail แล้ว');
      await queryClient.invalidateQueries({ queryKey: queryKeys.video(id) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const saveTemplate = useMutation({
    mutationFn: () =>
      createTemplateFromVideo(id, { title: video.data?.title ?? 'เทมเพลตของฉัน', is_public: false }),
    onSuccess: () => {
      setSavingTemplate(false);
      toast.success('บันทึกเป็นเทมเพลตส่วนตัวแล้ว');
    },
    onError: (error) => {
      setSavingTemplate(false);
      toast.error(errorMessage(error));
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteVideo(id),
    onSuccess: async () => {
      toast.success('ลบวิดีโอแล้ว');
      await queryClient.invalidateQueries({ queryKey: ['videos'] });
      router.replace('/(tabs)/projects');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (video.isLoading) {
    return <LoadingState message="กำลังโหลดวิดีโอ…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const data = video.data;
  const generating = IN_PROGRESS.has(data.status);

  return (
    <View style={styles.flex}>
      <GradientHeader title={data.title} subtitle={`${subjectLabel[data.subject]} · ${gradeLabel[data.grade_level]}`} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data.status === 'completed' && data.video_url ? (
          <Card padded={false} style={styles.playerCard}>
            <VideoView player={player} style={styles.player} fullscreenOptions={{ enable: true }} nativeControls contentFit="contain" />
          </Card>
        ) : generating ? (
          <Card style={styles.generatingCard}>
            <AIThinking
              message={`🤖 ${VIDEO_STATUS_LABEL[data.status]}…`}
              hint="ปิดแอปได้เลย ระบบทำงานต่อเบื้องหลังและจะแจ้งเตือนเมื่อเสร็จ"
            />
            <Text variant="h3" center color={colors.primary}>
              {Math.round(data.progress)}%
            </Text>
            <ProgressBar value={data.progress} height={10} />
          </Card>
        ) : data.status === 'failed' ? (
          <ErrorState
            title="สร้างวิดีโอไม่สำเร็จ"
            message={data.error_message ?? 'ระบบประกอบวิดีโอไม่สำเร็จ'}
            onRetry={() => router.push(`/wizard/${id}/render`)}
            actionLabel="ลองสร้างใหม่"
          />
        ) : (
          <Card style={styles.draftCard}>
            <Ionicons name="document-outline" size={28} color={colors.textMuted} />
            <Text variant="h3">แบบร่าง</Text>
            <Text variant="small" color={colors.textSecondary} center>
              วิดีโอนี้ยังไม่ถูกสร้าง กลับเข้าสู่ขั้นตอนเพื่อทำต่อได้ทันที
            </Text>
            <Button label="ทำต่อจากที่ค้างไว้" icon="play-forward" onPress={() => router.push(`/wizard/${id}/objectives`)} />
          </Card>
        )}

        <Card style={styles.metaCard}>
          <View style={styles.badgeRow}>
            <Badge label={VIDEO_STATUS_LABEL[data.status]} tone={data.status === 'completed' ? 'success' : 'ai'} />
            <Badge label={formatDuration(data.duration_min)} tone="primary" />
            <Badge label={formatLabel[data.format]} tone="neutral" />
            <Badge label={styleLabel[data.style]} tone="neutral" />
            {data.quality_score !== null ? (
              <Badge label={`คุณภาพ ${data.quality_score}/100`} tone={data.quality_score >= 85 ? 'success' : 'warning'} />
            ) : null}
          </View>
          <Text variant="caption" color={colors.textMuted}>
            สร้างเมื่อ {formatThaiDate(data.created_at)}
            {data.completed_at ? ` · เสร็จเมื่อ ${formatThaiDate(data.completed_at)}` : ''}
          </Text>
        </Card>

        {data.status === 'completed' ? (
          <View style={styles.actions}>
            <Button label="ส่งออกและแชร์" icon="share-social-outline" size="lg" onPress={() => router.push(`/video/${id}/export`)} />
            <Button label="🔍 ตรวจสอบคุณภาพ" variant="secondary" onPress={() => router.push(`/video/${id}/quality`)} />
            <Button
              label="🚀 สร้างชุดสื่อการสอนครบชุด"
              variant="premium"
              onPress={() => {
                if (!canUseLessonKit) {
                  setPaywall('ชุดสื่อการสอนครบชุด (PowerPoint ใบงาน แบบทดสอบ ใบความรู้ แผนการสอน) ใช้ได้ในแพ็กเกจ PRO TEACHER ขึ้นไป');
                  return;
                }

                router.push(`/video/${id}/kit`);
              }}
            />
            <Button
              label="เปลี่ยน Thumbnail"
              variant="ghost"
              icon="images-outline"
              loading={makeThumbnails.isPending}
              onPress={() => makeThumbnails.mutate()}
            />
            <Button label="บันทึกเป็นเทมเพลต" variant="ghost" icon="bookmark-outline" onPress={() => setSavingTemplate(true)} />
          </View>
        ) : null}

        <Button label="ลบวิดีโอนี้" variant="danger" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
      </ScrollView>

      <Sheet
        visible={thumbnails !== null}
        onClose={() => setThumbnails(null)}
        title="เลือก Thumbnail"
        subtitle="AI สร้างให้ 3 แบบ เลือกแบบที่ตรงกับบทเรียนของคุณที่สุด"
      >
        {thumbnails?.map((option) => (
          <Card key={option.id} onPress={() => pickThumbnail.mutate(option.id)} padded={false} style={styles.thumbOption}>
            <Image source={{ uri: option.url }} style={styles.thumbImage} contentFit="cover" transition={150} />
            <View style={styles.thumbCaption}>
              <Text variant="bodyStrong">{option.headline}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </Sheet>

      <ConfirmDialog
        visible={savingTemplate}
        title="บันทึกเป็นเทมเพลต"
        message="โครงบทเรียนนี้จะถูกบันทึกเป็นเทมเพลตส่วนตัว ใช้สร้างวิดีโอใหม่ได้ทันทีในครั้งถัดไป"
        confirmLabel="บันทึก"
        loading={saveTemplate.isPending}
        onConfirm={() => saveTemplate.mutate()}
        onCancel={() => setSavingTemplate(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="ลบวิดีโอนี้?"
        message="ไฟล์วิดีโอ ภาพ และเสียงทั้งหมดของวิดีโอนี้จะถูกลบถาวร และไม่สามารถกู้คืนได้"
        confirmLabel="ลบถาวร"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />

      <PaywallSheet
        visible={paywall !== null}
        onClose={() => setPaywall(null)}
        title="ฟีเจอร์พรีเมียม"
        reason={paywall ?? ''}
        suggestedPlan={nextPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  playerCard: { overflow: 'hidden' },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  generatingCard: { gap: spacing.md },
  draftCard: { alignItems: 'center', gap: spacing.sm },
  metaCard: { gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { gap: spacing.md },
  thumbOption: { overflow: 'hidden' },
  thumbImage: { width: '100%', height: 150, backgroundColor: colors.surfaceMuted },
  thumbCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
});
