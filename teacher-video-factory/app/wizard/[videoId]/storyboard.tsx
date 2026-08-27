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
  ErrorState,
  GradientHeader,
  Input,
  LoadingState,
  Select,
  Sheet,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { StoryboardTimeline } from '@/components/domain/StoryboardTimeline';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { generateAllImages, generateSceneImage, generateStoryboard } from '@/lib/api/ai';
import { reorderScenes } from '@/lib/api/videos';
import { useScenes, useVideo } from '@/hooks/useVideo';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { VISUAL_STYLES } from '@/constants/lesson';
import type { Scene, VisualStyle } from '@/types/domain';

/** ขั้นตอนที่ 4: Storyboard แบบ Timeline ลากสลับลำดับฉากได้ และสั่งสร้างภาพรายฉาก */
export default function StoryboardStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const queryClient = useQueryClient();
  const video = useVideo(videoId);
  const scenes = useScenes(videoId);
  const [selected, setSelected] = useState<Scene | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [styleDraft, setStyleDraft] = useState<VisualStyle | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.scenes(videoId) });

  const buildStoryboard = useMutation({
    mutationFn: async () => {
      const result = await guard.run('storyboard', 1, () => generateStoryboard(videoId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result.scenes;
    },
    onSuccess: async () => {
      track('storyboard_generated', { video_id: videoId });
      await refresh();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const renderAllImages = useMutation({
    mutationFn: async () => {
      const count = scenes.data?.length ?? 0;
      const result = await guard.run('image', count, () => generateAllImages(videoId));

      if (!result) {
        throw new Error('__handled__');
      }

      return result;
    },
    onSuccess: async () => {
      toast.success('เริ่มสร้างภาพทุกฉากแล้ว ระบบจะอัปเดตให้เองเมื่อเสร็จทีละภาพ');
      await refresh();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const renderOneImage = useMutation({
    mutationFn: async (input: { sceneId: string; prompt?: string; style?: string }) => {
      const result = await guard.run('image', 1, () =>
        generateSceneImage({
          video_id: videoId,
          scene_id: input.sceneId,
          prompt_override: input.prompt,
          style_override: input.style,
        }),
      );

      if (!result) {
        throw new Error('__handled__');
      }

      return result.scene;
    },
    onSuccess: async (scene) => {
      setSelected(scene);
      await refresh();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderScenes(videoId, orderedIds),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const hasPrompts = scenes.data?.some((scene) => Boolean(scene.image_prompt)) ?? false;

  useEffect(() => {
    if (scenes.isSuccess && (scenes.data?.length ?? 0) > 0 && !hasPrompts && buildStoryboard.isIdle) {
      buildStoryboard.mutate();
    }
  }, [buildStoryboard, hasPrompts, scenes.data, scenes.isSuccess]);

  if (video.isLoading || scenes.isLoading) {
    return <LoadingState message="กำลังโหลด Storyboard…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const readyImages = scenes.data?.filter((scene) => scene.image_status === 'ready').length ?? 0;
  const totalScenes = scenes.data?.length ?? 0;

  return (
    <View style={styles.flex}>
      <GradientHeader title="Storyboard" subtitle="ขั้นตอนที่ 4 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={3} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card tone="outlined" style={styles.summary}>
          <View style={styles.summaryRow}>
            <Badge label={`ภาพพร้อม ${readyImages}/${totalScenes}`} tone={readyImages === totalScenes ? 'success' : 'warning'} />
            <Badge label={`สไตล์: ${VISUAL_STYLES.find((s) => s.value === video.data.style)?.label ?? '-'}`} tone="ai" />
          </View>
          <Text variant="caption" color={colors.textMuted}>
            แตะที่ฉากเพื่อแก้ Prompt ภาพ · กดค้างแล้วลากเพื่อเปลี่ยนลำดับฉาก
          </Text>
        </Card>

        {buildStoryboard.isPending ? (
          <AIThinking message="🤖 AI กำลังออกแบบ Storyboard…" hint="กำลังเขียน Prompt ภาพให้ทุกฉาก" />
        ) : (
          <StoryboardTimeline
            scenes={scenes.data ?? []}
            onReorder={(ids) => reorder.mutate(ids)}
            onPressScene={(scene) => {
              setSelected(scene);
              setPromptDraft(scene.image_prompt ?? '');
              setStyleDraft(video.data.style);
            }}
          />
        )}

        <View style={styles.actions}>
          <Button
            label={`✨ สร้างภาพทุกฉาก (${totalScenes} ภาพ)`}
            variant="ai"
            loading={renderAllImages.isPending}
            disabled={!hasPrompts}
            onPress={() => renderAllImages.mutate()}
          />
          <Button
            label="สร้าง Storyboard ใหม่"
            variant="secondary"
            loading={buildStoryboard.isPending}
            onPress={() => buildStoryboard.mutate()}
          />
          <Button
            label="ถัดไป: เสียงบรรยาย & Subtitle"
            iconRight="arrow-forward"
            disabled={totalScenes === 0}
            onPress={() => router.push(`/wizard/${videoId}/voice`)}
          />
        </View>
      </ScrollView>

      <Sheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={`Scene ${(selected?.index ?? 0) + 1}`}
        subtitle={selected?.visual_description}
      >
        <Input
          label="Prompt ภาพ (ภาษาอังกฤษ)"
          value={promptDraft}
          onChangeText={setPromptDraft}
          multiline
          helper="ปรับข้อความนี้เพื่อควบคุมรายละเอียดของภาพที่ AI สร้าง"
        />
        <Select
          label="เปลี่ยนสไตล์เฉพาะฉากนี้"
          value={styleDraft}
          options={VISUAL_STYLES}
          onChange={setStyleDraft}
        />
        <Button
          label="✨ สร้างภาพใหม่"
          variant="ai"
          loading={renderOneImage.isPending}
          onPress={() =>
            selected &&
            renderOneImage.mutate({
              sceneId: selected.id,
              prompt: promptDraft.trim() || undefined,
              style: styleDraft ?? undefined,
            })
          }
        />
        <Button label="ปิด" variant="ghost" onPress={() => setSelected(null)} />
      </Sheet>

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
  actions: { gap: spacing.md },
});
