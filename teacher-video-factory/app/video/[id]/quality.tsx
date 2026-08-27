import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  AIThinking,
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientHeader,
  Text,
  useToast,
} from '@/components/ui';
import { QualityCheckList } from '@/components/domain/QualityCheckList';
import { runQualityCheck } from '@/lib/api/ai';
import { getQualityReport } from '@/lib/api/videos';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';

/** หน้า AI Quality Check — ตรวจก่อนส่งออกว่าสื่อพร้อมใช้สอนจริงหรือยัง */
export default function QualityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();

  const report = useQuery({ queryKey: queryKeys.quality(id), queryFn: () => getQualityReport(id) });

  const check = useMutation({
    mutationFn: () => runQualityCheck(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.quality(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.video(id) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <View style={styles.flex}>
      <GradientHeader title="🔍 AI Quality Check" subtitle="ตรวจสอบคุณภาพก่อนนำไปใช้สอน" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {report.isLoading ? (
          <AIThinking message="กำลังโหลดผลการตรวจสอบ…" />
        ) : report.isError ? (
          <ErrorState message={errorMessage(report.error)} onRetry={() => void report.refetch()} />
        ) : check.isPending ? (
          <AIThinking
            message="🤖 AI กำลังตรวจสอบคุณภาพวิดีโอ…"
            hint="ตรวจเนื้อหา บท ภาพ เสียง Subtitle และความสอดคล้องกับวัตถุประสงค์"
          />
        ) : report.data ? (
          <>
            <QualityCheckList report={report.data.report} />
            <Button label="ตรวจสอบอีกครั้ง" variant="secondary" icon="refresh" onPress={() => check.mutate()} />
            <Button label="ไปหน้าส่งออก" iconRight="arrow-forward" onPress={() => router.push(`/video/${id}/export`)} />
          </>
        ) : (
          <Card>
            <EmptyState
              emoji="🔍"
              title="ยังไม่ได้ตรวจสอบคุณภาพ"
              description="ให้ AI ตรวจความสอดคล้องของเนื้อหากับระดับชั้น ความยาว ภาพ เสียง และ Subtitle"
              actionLabel="เริ่มตรวจสอบ"
              onAction={() => check.mutate()}
            />
          </Card>
        )}

        <Text variant="caption" color={colors.textMuted}>
          ผลการตรวจสอบเป็นคำแนะนำจาก AI ครูควรพิจารณาความถูกต้องของเนื้อหาอีกครั้งก่อนนำไปใช้กับนักเรียน
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
});
