import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  AIThinking,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  GradientHeader,
  LoadingState,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { SceneEditorCard } from '@/components/domain/SceneEditorCard';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { addScene, generateScript, regenerateScene } from '@/lib/api/ai';
import { deleteScene, updateScene } from '@/lib/api/videos';
import { useScenes, useVideo } from '@/hooks/useVideo';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { formatTimecode } from '@/utils/format';
import type { Scene } from '@/types/domain';

/** ขั้นตอนที่ 3: AI เขียนบทและแบ่งฉากให้ ครูตรวจ แก้ เพิ่ม หรือลบฉากได้ */
export default function ScriptStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const queryClient = useQueryClient();
  const video = useVideo(videoId, { realtime: false });
  const scenes = useScenes(videoId, { realtime: false });
  const [pendingDelete, setPendingDelete] = useState<Scene | null>(null);
  const [busySceneId, setBusySceneId] = useState<string | null>(null);

  const refreshScenes = () => queryClient.invalidateQueries({ queryKey: queryKeys.scenes(videoId) });

  const generate = useMutation({
    mutationFn: async () => {
      const result = await guard.run('script', 1, () => generateScript(videoId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result.scenes;
    },
    onSuccess: async () => {
      track('script_generated', { video_id: videoId });
      await refreshScenes();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const saveScene = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Scene> }) => updateScene(id, patch),
    onSuccess: async () => {
      toast.success('บันทึกฉากแล้ว');
      await refreshScenes();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const regenerate = useMutation({
    mutationFn: async (sceneId: string) => {
      setBusySceneId(sceneId);
      const result = await guard.run('script', 1, () => regenerateScene(videoId, sceneId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result.scene;
    },
    onSuccess: async () => {
      await refreshScenes();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
    onSettled: () => setBusySceneId(null),
  });

  const append = useMutation({
    mutationFn: async (afterSceneId: string | null) => {
      const result = await guard.run('script', 1, () => addScene(videoId, afterSceneId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result.scene;
    },
    onSuccess: refreshScenes,
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const removeScene = useMutation({
    mutationFn: (sceneId: string) => deleteScene(sceneId),
    onSuccess: async () => {
      setPendingDelete(null);
      await refreshScenes();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  // เข้าหน้านี้ครั้งแรกแล้วยังไม่มีบท ให้ AI เขียนให้เลย ครูไม่ต้องกดเพิ่ม
  useEffect(() => {
    if (scenes.isSuccess && scenes.data.length === 0 && generate.isIdle) {
      generate.mutate();
    }
  }, [generate, scenes.data, scenes.isSuccess]);

  if (video.isLoading || scenes.isLoading) {
    return <LoadingState message="กำลังโหลดบทวิดีโอ…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const totalSeconds = scenes.data?.reduce((max, scene) => Math.max(max, scene.end_sec), 0) ?? 0;

  return (
    <View style={styles.flex}>
      <GradientHeader title="บทวิดีโอจาก AI" subtitle="ขั้นตอนที่ 3 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={2} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card tone="outlined" style={styles.summary}>
          <View style={styles.summaryRow}>
            <Badge label={`${scenes.data?.length ?? 0} ฉาก`} tone="primary" />
            <Badge label={`ความยาวรวม ${formatTimecode(totalSeconds)}`} tone="ai" />
            <Badge
              label={`เป้าหมาย ${video.data.duration_min} นาที`}
              tone={Math.abs(totalSeconds - video.data.duration_min * 60) <= 30 ? 'success' : 'warning'}
            />
          </View>
          <Text variant="caption" color={colors.textMuted}>
            ตรวจสอบภาษาให้เหมาะกับระดับชั้น แล้วกดถัดไปเพื่อให้ AI สร้าง Storyboard
          </Text>
        </Card>

        {generate.isPending ? (
          <AIThinking message="🤖 AI กำลังเขียนบทและแบ่งฉาก…" hint="ใช้เวลาประมาณ 20–40 วินาที" />
        ) : (
          <View style={styles.list}>
            {scenes.data?.map((scene) => (
              <SceneEditorCard
                key={scene.id}
                scene={scene}
                busy={busySceneId === scene.id}
                onSave={(patch) => saveScene.mutate({ id: scene.id, patch })}
                onRegenerate={() => regenerate.mutate(scene.id)}
                onDelete={() => setPendingDelete(scene)}
                onAddAfter={() => append.mutate(scene.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="✨ ให้ AI เขียนบทใหม่ทั้งหมด"
            variant="secondary"
            loading={generate.isPending}
            onPress={() => generate.mutate()}
          />
          <Button
            label="ถัดไป: สร้าง Storyboard"
            iconRight="arrow-forward"
            disabled={(scenes.data?.length ?? 0) === 0}
            onPress={() => router.push(`/wizard/${videoId}/storyboard`)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="ลบฉากนี้?"
        message={`ฉากที่ ${(pendingDelete?.index ?? 0) + 1} จะถูกลบและเวลาของฉากอื่นจะถูกคำนวณใหม่`}
        confirmLabel="ลบฉาก"
        destructive
        loading={removeScene.isPending}
        onConfirm={() => pendingDelete && removeScene.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

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
  summary: { gap: spacing.sm },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.lg },
  actions: { gap: spacing.md },
});
