import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Badge, Button, Card, Text } from '@/components/ui';
import type { Plan } from '@/constants/billing';
import { formatTHB } from '@/utils/format';

export function PlanCard({
  plan,
  current,
  loading,
  onSelect,
}: {
  plan: Plan;
  current: boolean;
  loading?: boolean;
  onSelect: () => void;
}) {
  return (
    <Card style={[styles.card, plan.highlight && styles.highlight, current && styles.current]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="h2">{plan.name}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {plan.tagline}
          </Text>
        </View>
        {current ? <Badge label="แพ็กเกจปัจจุบัน" tone="success" /> : plan.badge ? <Badge label={plan.badge} tone="ai" /> : null}
      </View>

      <View style={styles.priceRow}>
        <Text variant="display" color={colors.primary}>
          {plan.priceTHB === 0 ? 'ฟรี' : formatTHB(plan.priceTHB)}
        </Text>
        {plan.priceTHB > 0 ? (
          <Text variant="small" color={colors.textMuted}>
            /เดือน
          </Text>
        ) : null}
      </View>

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text variant="small" style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <Button
        label={current ? 'กำลังใช้งานอยู่' : plan.priceTHB === 0 ? 'ใช้แพ็กเกจฟรี' : `เลือก ${plan.name}`}
        variant={current ? 'secondary' : plan.highlight ? 'premium' : 'primary'}
        disabled={current}
        loading={loading}
        onPress={onSelect}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  highlight: { borderWidth: 2, borderColor: colors.accent },
  current: { borderWidth: 2, borderColor: colors.success },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  features: { gap: spacing.sm },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureText: { flex: 1 },
  currentBadge: { borderRadius: radius.pill },
});
