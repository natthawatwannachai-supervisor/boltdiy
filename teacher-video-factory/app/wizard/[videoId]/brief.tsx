import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  Button,
  ErrorState,
  GradientHeader,
  LoadingState,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { LessonBriefForm } from '@/components/domain/LessonBriefForm';
import { WIZARD_STEPS } from '@/constants/wizard';
import { updateVideo } from '@/lib/api/videos';
import { useVideo } from '@/hooks/useVideo';
import { usePlan } from '@/hooks/usePlan';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import type { LessonBrief } from '@/types/domain';

/** ขั้นตอนที่ 1 (แก้ไข): ปรับข้อมูลบทเรียนของแบบร่างที่มีอยู่แล้ว */
export default function BriefStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { plan } = usePlan();
  const video = useVideo(videoId, { realtime: false });
  const [brief, setBrief] = useState<LessonBrief | null>(null);

  useEffect(() => {
    const data = video.data;

    if (data && !brief) {
      setBrief({
        topic: data.topic,
        grade_level: data.grade_level,
        subject: data.subject,
        duration_min: data.duration_min,
        format: data.format,
        style: data.style,
      });
    }
  }, [brief, video.data]);

  const save = useMutation({
    mutationFn: () => updateVideo(videoId, { ...brief!, title: brief!.topic }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.video(videoId) });
      router.push(`/wizard/${videoId}/objectives`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (video.isLoading || !brief) {
    return <LoadingState message="กำลังโหลดข้อมูลบทเรียน…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  return (
    <View style={styles.flex}>
      <GradientHeader title="ข้อมูลบทเรียน" subtitle="ขั้นตอนที่ 1 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={0} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="small" color={colors.textSecondary}>
          การแก้ไขข้อมูลจะมีผลกับบทวิดีโอที่ AI สร้างในขั้นตอนถัดไป
          หากคุณเคยสร้างบทไว้แล้ว แนะนำให้กด “ให้ AI สร้างใหม่” ในขั้นตอนที่ 3 อีกครั้ง
        </Text>

        <LessonBriefForm value={brief} onChange={setBrief} maxDurationMin={plan.maxDurationMin} />

        <Button
          label="บันทึกและไปต่อ"
          iconRight="arrow-forward"
          loading={save.isPending}
          disabled={brief.topic.trim().length < 2}
          onPress={() => save.mutate()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
});
