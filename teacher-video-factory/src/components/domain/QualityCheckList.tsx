import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Card, ProgressBar, Text } from '@/components/ui';
import type { QualityReport } from '@/types/domain';

const scoreTone = (score: number) => {
  if (score >= 85) {
    return colors.success;
  }

  if (score >= 70) {
    return colors.warning;
  }

  return colors.danger;
};

export function QualityCheckList({ report }: { report: QualityReport }) {
  return (
    <View style={styles.wrapper}>
      <Card style={styles.scoreCard}>
        <Text variant="small" color={colors.textSecondary}>
          คะแนนคุณภาพโดยรวม
        </Text>
        <View style={styles.scoreRow}>
          <Text variant="display" color={scoreTone(report.score)}>
            {report.score}
          </Text>
          <Text variant="h3" color={colors.textMuted}>
            /100
          </Text>
        </View>
        <ProgressBar value={report.score} tone={report.score >= 85 ? 'success' : 'ai'} />
      </Card>

      <View style={styles.checks}>
        {report.checks.map((check) => (
          <Card key={check.key} tone="outlined" style={styles.check}>
            <Ionicons
              name={check.passed ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={check.passed ? colors.success : colors.warning}
            />
            <View style={styles.checkText}>
              <Text variant="bodyStrong">{check.label}</Text>
              <Text variant="small" color={colors.textSecondary}>
                {check.detail}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {report.suggestions.length > 0 ? (
        <Card style={styles.suggestions}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.accent} />
            <Text variant="bodyStrong">คำแนะนำจาก AI</Text>
          </View>
          {report.suggestions.map((suggestion, index) => (
            <Text key={index} variant="small" color={colors.textSecondary}>
              • {suggestion}
            </Text>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  scoreCard: { alignItems: 'center', gap: spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  checks: { gap: spacing.sm },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  checkText: { flex: 1, gap: 2 },
  suggestions: { gap: spacing.sm, backgroundColor: colors.accentSoft },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
