import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme';
import { Badge, Card, ProgressBar, Text } from '@/components/ui';
import { VIDEO_STATUS_LABEL } from '@/i18n/th';
import { gradeLabel, subjectEmoji, subjectLabel } from '@/constants/lesson';
import { formatDuration, formatRelativeTime } from '@/utils/format';
import type { VideoRow } from '@/types/database';

const statusTone = (status: VideoRow['status']) => {
  if (status === 'completed') {
    return 'success' as const;
  }

  if (status === 'failed') {
    return 'danger' as const;
  }

  if (status === 'draft') {
    return 'neutral' as const;
  }

  return 'ai' as const;
};

export function VideoCard({
  video,
  onPress,
  compact = false,
}: {
  video: VideoRow;
  onPress: () => void;
  compact?: boolean;
}) {
  const inProgress = video.status !== 'completed' && video.status !== 'draft' && video.status !== 'failed';

  return (
    <Card onPress={onPress} padded={false} style={compact ? styles.compactCard : undefined}>
      <View style={[styles.thumbWrapper, compact && styles.thumbCompact]}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumb} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[...gradients.ai]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb}>
            <Text style={styles.thumbEmoji}>{subjectEmoji[video.subject] ?? '🎬'}</Text>
          </LinearGradient>
        )}
        <View style={styles.durationTag}>
          <Ionicons name="time-outline" size={12} color={colors.onPrimary} />
          <Text variant="caption" color={colors.onPrimary}>
            {formatDuration(video.duration_min)}
          </Text>
        </View>
        {video.watermarked && video.status === 'completed' ? (
          <View style={styles.watermark}>
            <Text variant="caption" color={colors.onPrimary}>
              ลายน้ำ
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text variant="h3" numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.metaRow}>
          <Badge label={VIDEO_STATUS_LABEL[video.status]} tone={statusTone(video.status)} />
          <Text variant="caption" color={colors.textMuted}>
            {subjectLabel[video.subject]} · {gradeLabel[video.grade_level]}
          </Text>
        </View>

        {inProgress ? (
          <View style={styles.progress}>
            <ProgressBar value={video.progress} height={6} />
            <Text variant="caption" color={colors.accent}>
              {VIDEO_STATUS_LABEL[video.status]} {Math.round(video.progress)}%
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.textMuted}>
            อัปเดต {formatRelativeTime(video.updated_at)}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compactCard: { width: 240 },
  thumbWrapper: { height: 148, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  thumbCompact: { height: 124 },
  thumb: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 40, lineHeight: 48 },
  durationTag: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7,21,57,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  watermark: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: 'rgba(7,21,57,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  progress: { gap: 6 },
});
