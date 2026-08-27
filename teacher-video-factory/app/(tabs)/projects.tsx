import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  Button,
  Card,
  EmptyState,
  GradientHeader,
  IconButton,
  Input,
  SegmentedControl,
  Sheet,
  Text,
  VideoCardSkeleton,
  useToast,
} from '@/components/ui';
import { VideoCard } from '@/components/domain/VideoCard';
import { ProjectCard } from '@/components/domain/ProjectCard';
import { queryKeys } from '@/lib/queryClient';
import { listVideos, type VideoFilter } from '@/lib/api/videos';
import { createProject, listProjects } from '@/lib/api/projects';
import { errorMessage } from '@/lib/errors';
import { th } from '@/i18n/th';

const FILTERS: { value: VideoFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'in_progress', label: 'กำลังสร้าง' },
  { value: 'completed', label: 'เสร็จแล้ว' },
  { value: 'draft', label: 'แบบร่าง' },
];

export default function ProjectsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<VideoFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  const videos = useQuery({
    queryKey: queryKeys.videos(filter),
    queryFn: () => listVideos(filter),
  });

  const projects = useQuery({ queryKey: queryKeys.projects(), queryFn: listProjects });

  const addProject = useMutation({
    mutationFn: () => createProject({ name: projectName.trim() }),
    onSuccess: async () => {
      setCreating(false);
      setProjectName('');
      toast.success('สร้างโปรเจกต์แล้ว');
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['videos'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={styles.flex}>
      <GradientHeader
        title={th.nav.projects}
        subtitle="จัดกลุ่มสื่อการสอนของคุณตามรายวิชาและหน่วยการเรียนรู้"
        right={
          <IconButton
            icon="add"
            label="สร้างโปรเจกต์ใหม่"
            background="rgba(255,255,255,0.18)"
            color={colors.onPrimary}
            onPress={() => setCreating(true)}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />}
      >
        {(projects.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <Text variant="h3">📁 โฟลเดอร์โปรเจกต์</Text>
            {projects.data?.map((project) => (
              <ProjectCard key={project.id} project={project} onPress={() => router.push(`/project/${project.id}`)} />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text variant="h3">🎬 วิดีโอทั้งหมด</Text>
          <SegmentedControl segments={FILTERS} value={filter} onChange={setFilter} />

          {videos.isLoading ? (
            <>
              <VideoCardSkeleton />
              <VideoCardSkeleton />
            </>
          ) : (videos.data?.length ?? 0) === 0 ? (
            <Card>
              <EmptyState
                emoji="🎥"
                title={filter === 'draft' ? 'ยังไม่มีแบบร่าง' : th.empty.videos}
                description={th.empty.videosHint}
                actionLabel="สร้างวิดีโอใหม่"
                onAction={() => router.push('/(tabs)/create')}
              />
            </Card>
          ) : (
            videos.data?.map((video) => (
              <VideoCard key={video.id} video={video} onPress={() => router.push(`/video/${video.id}`)} />
            ))
          )}
        </View>
      </ScrollView>

      <Sheet
        visible={creating}
        onClose={() => setCreating(false)}
        title="สร้างโปรเจกต์ใหม่"
        subtitle="เช่น “วิทยาศาสตร์ ป.5” เพื่อรวบรวมวิดีโอของหน่วยเดียวกัน"
        scroll={false}
      >
        <View style={styles.sheetForm}>
          <Input
            label="ชื่อโปรเจกต์"
            required
            value={projectName}
            onChangeText={setProjectName}
            placeholder="วิทยาศาสตร์ ป.5"
            icon="folder-outline"
          />
          <Button
            label="สร้างโปรเจกต์"
            loading={addProject.isPending}
            disabled={projectName.trim().length < 2}
            onPress={() => addProject.mutate()}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing['2xl'], paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md },
  sheetForm: { gap: spacing.lg },
});
