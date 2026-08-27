import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  AIThinking,
  Button,
  Card,
  ErrorState,
  GradientHeader,
  IconButton,
  Input,
  LoadingState,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { generateObjectives } from '@/lib/api/ai';
import { updateVideo } from '@/lib/api/videos';
import { useVideo } from '@/hooks/useVideo';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { gradeLabel, subjectLabel } from '@/constants/lesson';
import type { LearningObjective } from '@/types/domain';

/** ขั้นตอนที่ 2: AI ร่างวัตถุประสงค์การเรียนรู้ให้ ครูปรับแก้ได้ทุกข้อ */
export default function ObjectivesStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const queryClient = useQueryClient();
  const video = useVideo(videoId, { realtime: false });

  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (video.data?.objectives?.length) {
      setObjectives(video.data.objectives);
    }
  }, [video.data?.objectives]);

  const generate = useMutation({
    mutationFn: async () => {
      const result = await guard.run('objectives', 1, () => generateObjectives(videoId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result.objectives;
    },
    onSuccess: (next) => {
      setObjectives(next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.video(videoId) });
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const save = useMutation({
    mutationFn: () => updateVideo(videoId, { objectives }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.video(videoId) });
      router.push(`/wizard/${videoId}/script`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  // ถ้ายังไม่มีวัตถุประสงค์ ให้ AI ร่างให้อัตโนมัติทันทีที่เข้าหน้านี้
  useEffect(() => {
    if (video.data && (video.data.objectives?.length ?? 0) === 0 && !generate.isPending && generate.isIdle) {
      generate.mutate();
    }
  }, [generate, video.data]);

  if (video.isLoading) {
    return <LoadingState message="กำลังโหลดข้อมูลบทเรียน…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const commitEdit = () => {
    if (editingIndex === null) {
      return;
    }

    setObjectives((current) =>
      current.map((item, index) => (index === editingIndex ? { ...item, text: draft.trim() } : item)),
    );
    setEditingIndex(null);
    setDraft('');
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="วัตถุประสงค์การเรียนรู้" subtitle="ขั้นตอนที่ 2 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={1} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card tone="outlined" style={styles.contextCard}>
          <Text variant="bodyStrong">{video.data.title}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {subjectLabel[video.data.subject]} · {gradeLabel[video.data.grade_level]} · {video.data.duration_min} นาที
          </Text>
        </Card>

        {generate.isPending ? (
          <AIThinking message="🤖 AI กำลังกำหนดวัตถุประสงค์การเรียนรู้…" hint="อ้างอิงระดับชั้นและเวลาที่คุณเลือกไว้" />
        ) : (
          <View style={styles.list}>
            {objectives.map((objective, index) => (
              <Card key={objective.id} style={styles.objectiveCard}>
                <View style={styles.objectiveRow}>
                  <View style={styles.bullet}>
                    <Text variant="caption" color={colors.primary}>
                      {index + 1}
                    </Text>
                  </View>

                  {editingIndex === index ? (
                    <View style={styles.editArea}>
                      <Input value={draft} onChangeText={setDraft} multiline autoFocus />
                      <View style={styles.editActions}>
                        <Button label="บันทึก" size="sm" fullWidth={false} onPress={commitEdit} />
                        <Button label="ยกเลิก" size="sm" variant="ghost" fullWidth={false} onPress={() => setEditingIndex(null)} />
                      </View>
                    </View>
                  ) : (
                    <Text variant="body" style={styles.objectiveText}>
                      {objective.text}
                    </Text>
                  )}

                  {editingIndex !== index ? (
                    <View style={styles.objectiveActions}>
                      <IconButton
                        icon="create-outline"
                        label="แก้ไขวัตถุประสงค์"
                        onPress={() => {
                          setEditingIndex(index);
                          setDraft(objective.text);
                        }}
                      />
                      <IconButton
                        icon="trash-outline"
                        label="ลบวัตถุประสงค์"
                        color={colors.danger}
                        onPress={() => setObjectives((current) => current.filter((_, i) => i !== index))}
                      />
                    </View>
                  ) : null}
                </View>
              </Card>
            ))}

            <Button
              label="เพิ่มวัตถุประสงค์เอง"
              variant="ghost"
              icon="add"
              onPress={() =>
                setObjectives((current) => [
                  ...current,
                  { id: `manual-${Date.now()}`, text: 'นักเรียนสามารถ…' },
                ])
              }
            />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="✨ ให้ AI สร้างใหม่"
            variant="secondary"
            loading={generate.isPending}
            onPress={() => generate.mutate()}
          />
          <Button
            label="ถัดไป: สร้างบทวิดีโอ"
            iconRight="arrow-forward"
            loading={save.isPending}
            disabled={objectives.length === 0}
            onPress={() => save.mutate()}
          />
        </View>

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text variant="caption" color={colors.textMuted} style={styles.tipText}>
            วัตถุประสงค์เหล่านี้จะถูกใช้ตรวจสอบคุณภาพวิดีโอในขั้นตอนสุดท้าย
          </Text>
        </View>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  contextCard: { gap: 2 },
  list: { gap: spacing.md },
  objectiveCard: { paddingVertical: spacing.md },
  objectiveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveText: { flex: 1 },
  objectiveActions: { flexDirection: 'row', gap: spacing.xs },
  editArea: { flex: 1, gap: spacing.sm },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  actions: { gap: spacing.md },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  tipText: { flex: 1 },
});
