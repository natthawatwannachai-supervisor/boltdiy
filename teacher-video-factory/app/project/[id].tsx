import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  GradientHeader,
  LoadingState,
  Text,
  useToast,
} from '@/components/ui';
import { VideoCard } from '@/components/domain/VideoCard';
import { deleteProject, duplicateProject, getProject } from '@/lib/api/projects';
import { listVideos } from '@/lib/api/videos';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import { gradeLabel, subjectLabel } from '@/constants/lesson';
import { th } from '@/i18n/th';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = useQuery({ queryKey: queryKeys.project(id), queryFn: () => getProject(id) });
  const videos = useQuery({ queryKey: queryKeys.videos('all', id), queryFn: () => listVideos('all', id) });

  const duplicate = useMutation({
    mutationFn: () => duplicateProject(id),
    onSuccess: async (newId) => {
      toast.success('ทำสำเนาโปรเจกต์แล้ว');
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      router.replace(`/project/${newId}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: async () => {
      toast.success('ลบโปรเจกต์แล้ว');
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      router.replace('/(tabs)/projects');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (project.isLoading) {
    return <LoadingState message="กำลังโหลดโปรเจกต์…" />;
  }

  if (project.isError || !project.data) {
    return <ErrorState message={errorMessage(project.error)} onRetry={() => void project.refetch()} />;
  }

  const meta = [
    project.data.subject ? subjectLabel[project.data.subject] : null,
    project.data.grade_level ? gradeLabel[project.data.grade_level] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.flex}>
      <GradientHeader title={`📁 ${project.data.name}`} subtitle={meta || project.data.description || 'โปรเจกต์ของฉัน'} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actions}>
          <Button
            label="สร้างวิดีโอในโปรเจกต์นี้"
            icon="add"
            onPress={() => router.push({ pathname: '/(tabs)/create', params: { projectId: id } })}
          />
          <Button
            label={th.action.duplicate}
            variant="secondary"
            icon="copy-outline"
            loading={duplicate.isPending}
            onPress={() => duplicate.mutate()}
          />
        </View>

        {videos.isLoading ? (
          <LoadingState message="กำลังโหลดวิดีโอ…" />
        ) : (videos.data?.length ?? 0) === 0 ? (
          <Card>
            <EmptyState
              emoji="📼"
              title="ยังไม่มีวิดีโอในโปรเจกต์นี้"
              description="เริ่มบทที่ 1 ได้เลย — พิมพ์หัวข้อแล้วให้ AI สร้างให้"
              actionLabel="สร้างวิดีโอ"
              onAction={() => router.push({ pathname: '/(tabs)/create', params: { projectId: id } })}
            />
          </Card>
        ) : (
          videos.data?.map((video) => (
            <VideoCard key={video.id} video={video} onPress={() => router.push(`/video/${video.id}`)} />
          ))
        )}

        <Button label="ลบโปรเจกต์" variant="danger" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
        <Text variant="caption" color={colors.textMuted}>
          การลบโปรเจกต์จะไม่ลบวิดีโอข้างใน วิดีโอจะย้ายกลับไปอยู่ในรายการทั้งหมด
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="ลบโปรเจกต์นี้?"
        message="โฟลเดอร์จะถูกลบ แต่วิดีโอทั้งหมดยังอยู่ในรายการวิดีโอของคุณ"
        confirmLabel="ลบโปรเจกต์"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['4xl'] },
  actions: { gap: spacing.sm },
});
