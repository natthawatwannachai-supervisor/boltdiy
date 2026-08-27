import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Text } from '@/components/ui';
import { formatNumber } from '@/utils/format';

export function CreditPill({
  balance,
  onPress,
  onDark = false,
}: {
  balance: number;
  onPress: () => void;
  onDark?: boolean;
}) {
  const low = balance < 20;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`เครดิตคงเหลือ ${balance}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        onDark ? styles.onDark : styles.onLight,
        low && !onDark && styles.low,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="sparkles"
        size={14}
        color={onDark ? colors.onPrimary : low ? colors.warning : colors.accent}
      />
      <Text variant="small" color={onDark ? colors.onPrimary : colors.text}>
        {formatNumber(balance)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
  },
  onLight: { backgroundColor: colors.accentSoft },
  onDark: { backgroundColor: 'rgba(255,255,255,0.18)' },
  low: { backgroundColor: colors.warningSoft },
  pressed: { opacity: 0.8 },
});
