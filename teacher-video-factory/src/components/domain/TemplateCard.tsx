import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Badge, Card, Text } from '@/components/ui';
import { formatLabel, gradeLabel, subjectEmoji, subjectLabel } from '@/constants/lesson';
import { formatDuration, formatNumber } from '@/utils/format';
import type { Template } from '@/types/domain';

export function TemplateCard({ template, onPress }: { template: Template; onPress: () => void }) {
  const grades = template.grade_levels.map((g) => gradeLabel[g]).join(', ');

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.cover}>
          <Text style={styles.emoji}>{subjectEmoji[template.subject] ?? '📘'}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text variant="h3" numberOfLines={1} style={styles.title}>
              {template.title}
            </Text>
            {template.is_official ? <Badge label="ทางการ" tone="primary" icon="shield-checkmark" /> : null}
          </View>
          <Text variant="small" color={colors.textSecondary} numberOfLines={2}>
            {template.description ?? `${subjectLabel[template.subject]} · ${formatLabel[template.format]}`}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="caption" color={colors.textMuted}>
              {grades || 'ทุกระดับชั้น'} · {formatDuration(template.duration_min)}
            </Text>
            <View style={styles.usage}>
              <Ionicons name="people-outline" size={12} color={colors.textMuted} />
              <Text variant="caption" color={colors.textMuted}>
                {formatNumber(template.usage_count)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  cover: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26, lineHeight: 32 },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usage: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
