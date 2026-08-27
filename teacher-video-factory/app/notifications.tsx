import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import { Card, EmptyState, GradientHeader, LoadingState, Text } from '@/components/ui';
import { listNotifications, markAllRead, subscribeToNotifications } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/queryClient';
import { useCurrentUserId } from '@/store/session';
import { formatRelativeTime } from '@/utils/format';
import { th } from '@/i18n/th';
import type { NotificationRow } from '@/types/database';

const ICONS: Record<NotificationRow['kind'], keyof typeof Ionicons.glyphMap> = {
  video_ready: 'film-outline',
  credits: 'sparkles-outline',
  system: 'information-circle-outline',
  milestone: 'trophy-outline',
};

const TINTS: Record<NotificationRow['kind'], string> = {
  video_ready: colors.primary,
  credits: colors.accent,
  system: colors.textSecondary,
  milestone: colors.warning,
};

export default function NotificationsScreen() {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: queryKeys.notifications(), queryFn: () => listNotifications() });

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToNotifications(userId, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    });
  }, [queryClient, userId]);

  // เปิดหน้านี้ = อ่านแล้ว จึงล้างตัวนับที่หน้าหลักให้ทันที
  useEffect(() => {
    void markAllRead().then(() => queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() }));
  }, [queryClient]);

  return (
    <View style={styles.flex}>
      <GradientHeader title="การแจ้งเตือน" subtitle="ความคืบหน้าของงาน AI และรางวัลจากการเชิญเพื่อน" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.isLoading ? (
          <LoadingState />
        ) : (notifications.data?.length ?? 0) === 0 ? (
          <Card>
            <EmptyState emoji="🔔" title={th.empty.notifications} description="เมื่อวิดีโอสร้างเสร็จ เราจะแจ้งให้ทราบที่นี่" />
          </Card>
        ) : (
          notifications.data?.map((item) => (
            <Card
              key={item.id}
              onPress={item.video_id ? () => router.push(`/video/${item.video_id}`) : undefined}
              style={[styles.row, !item.read_at && styles.unread]}
            >
              <View style={[styles.icon, { backgroundColor: `${TINTS[item.kind]}1A` }]}>
                <Ionicons name={ICONS[item.kind]} size={20} color={TINTS[item.kind]} />
              </View>
              <View style={styles.info}>
                <Text variant="bodyStrong">{item.title}</Text>
                <Text variant="small" color={colors.textSecondary}>
                  {item.body}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {formatRelativeTime(item.created_at)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['4xl'] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
});
