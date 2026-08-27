import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  Badge,
  Button,
  Card,
  GradientHeader,
  IconButton,
  ProgressBar,
  Text,
  VideoCardSkeleton,
} from '@/components/ui';
import { VideoCard } from '@/components/domain/VideoCard';
import { TemplateCard } from '@/components/domain/TemplateCard';
import { CreditPill } from '@/components/domain/CreditPill';
import { EmptyState } from '@/components/ui/States';
import { queryKeys } from '@/lib/queryClient';
import { listActiveVideos, listRecentVideos } from '@/lib/api/videos';
import { listTemplates } from '@/lib/api/templates';
import { countUnread } from '@/lib/api/notifications';
import { useProfile, useWallet } from '@/store/session';
import { usePlan } from '@/hooks/usePlan';
import { th, VIDEO_STATUS_LABEL } from '@/i18n/th';
import { formatNumber } from '@/utils/format';

export default function HomeScreen() {
  const profile = useProfile();
  const wallet = useWallet();
  const { plan, videosLeft } = usePlan();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const recent = useQuery({ queryKey: queryKeys.recentVideos(), queryFn: () => listRecentVideos(6) });
  const active = useQuery({
    queryKey: queryKeys.activeVideos(),
    queryFn: listActiveVideos,
    // งานเบื้องหลังคืบหน้าเรื่อย ๆ จึงดึงซ้ำเป็นระยะระหว่างที่ยังมีงานค้าง
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? 6000 : false),
  });
  const templates = useQuery({
    queryKey: queryKeys.templates('all', ''),
    queryFn: () => listTemplates(),
    select: (data) => data.slice(0, 4),
  });
  const unread = useQuery({ queryKey: queryKeys.unreadCount(), queryFn: countUnread });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['videos'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const greeting = profile?.first_name ? `สวัสดีคุณครู${profile.first_name}` : 'สวัสดีคุณครู';

  return (
    <View style={styles.flex}>
      <GradientHeader
        title={greeting}
        subtitle={profile?.school ?? th.tagline}
        right={
          <View style={styles.headerActions}>
            <CreditPill balance={wallet?.balance ?? 0} onPress={() => router.push('/credits')} onDark />
            <View>
              <IconButton
                icon="notifications-outline"
                label="การแจ้งเตือน"
                background="rgba(255,255,255,0.18)"
                color={colors.onPrimary}
                onPress={() => router.push('/notifications')}
              />
              {(unread.data ?? 0) > 0 ? <View style={styles.dot} /> : null}
            </View>
          </View>
        }
      >
        <Card style={styles.ctaCard}>
          <Text variant="h3">วันนี้คุณอยากสอนเรื่องอะไร?</Text>
          <Text variant="small" color={colors.textSecondary}>
            พิมพ์หัวข้อเดียว แล้วให้ AI จัดการบท ภาพ เสียง และการตัดต่อให้ทั้งหมด
          </Text>
          <Button
            label="🎬 สร้างวิดีโอด้วย AI"
            size="lg"
            variant="ai"
            onPress={() => router.push('/(tabs)/create')}
          />
          <View style={styles.quotaRow}>
            <Badge label={`แพ็กเกจ ${plan.name}`} tone="primary" />
            <Text variant="caption" color={colors.textMuted}>
              เหลือ {videosLeft} วิดีโอในเดือนนี้ · {formatNumber(wallet?.balance ?? 0)} เครดิต
            </Text>
          </View>
        </Card>
      </GradientHeader>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />}
      >
        {(active.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="กำลังสร้าง" icon="sparkles" />
            {active.data?.map((video) => (
              <Card key={video.id} onPress={() => router.push(`/video/${video.id}`)} style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <Text variant="bodyStrong" numberOfLines={1} style={styles.flexText}>
                    {video.title}
                  </Text>
                  <Text variant="small" color={colors.accent}>
                    {Math.round(video.progress)}%
                  </Text>
                </View>
                <ProgressBar value={video.progress} height={8} />
                <Text variant="caption" color={colors.textSecondary}>
                  🤖 {VIDEO_STATUS_LABEL[video.status]} — ปิดแอปได้เลย เราจะแจ้งเตือนเมื่อเสร็จ
                </Text>
              </Card>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            title="วิดีโอล่าสุด"
            icon="film-outline"
            actionLabel={th.action.seeAll}
            onAction={() => router.push('/(tabs)/projects')}
          />

          {recent.isLoading ? (
            <VideoCardSkeleton />
          ) : (recent.data?.length ?? 0) === 0 ? (
            <Card>
              <EmptyState
                emoji="🎬"
                title={th.empty.videos}
                description={th.empty.videosHint}
                actionLabel="สร้างวิดีโอแรกของคุณ"
                onAction={() => router.push('/(tabs)/create')}
              />
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {recent.data?.map((video) => (
                <VideoCard key={video.id} video={video} compact onPress={() => router.push(`/video/${video.id}`)} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="เทมเพลตแนะนำ"
            icon="grid-outline"
            actionLabel={th.action.seeAll}
            onAction={() => router.push('/(tabs)/templates')}
          />
          {templates.data?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => router.push({ pathname: '/(tabs)/create', params: { templateId: template.id } })}
            />
          ))}
        </View>

        <Card style={styles.assistantCard} onPress={() => router.push('/assistant')}>
          <View style={styles.assistantRow}>
            <View style={styles.assistantIcon}>
              <Text style={styles.assistantEmoji}>🤖</Text>
            </View>
            <View style={styles.flexText}>
              <Text variant="h3">น้อง Teacher AI</Text>
              <Text variant="small" color={colors.textSecondary}>
                ถามอะไรก็ได้ เช่น “สร้างคำถามหลังดูวิดีโอ 5 ข้อ”
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitle}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text variant="h3">{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Text variant="small" color={colors.primary} onPress={onAction}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  ctaCard: { gap: spacing.md },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  content: { padding: spacing.lg, gap: spacing['2xl'], paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  carousel: { gap: spacing.md, paddingRight: spacing.lg },
  activeCard: { gap: spacing.sm },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assistantCard: { backgroundColor: colors.accentSoft },
  assistantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  assistantIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantEmoji: { fontSize: 24, lineHeight: 30 },
});
