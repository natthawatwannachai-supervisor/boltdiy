import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

export interface Step {
  key: string;
  label: string;
}

/** แถบบอกขั้นตอนของ Wizard 6 ขั้น — เลื่อนแนวนอนได้บนจอเล็ก */
export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <View key={step.key} style={styles.item}>
            <View
              style={[
                styles.bullet,
                done && styles.bulletDone,
                active && styles.bulletActive,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              ) : (
                <Text variant="caption" color={active ? colors.onPrimary : colors.textMuted}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              variant="caption"
              color={active ? colors.primary : done ? colors.textSecondary : colors.textMuted}
              style={active ? styles.labelActive : undefined}
              numberOfLines={1}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletActive: { backgroundColor: colors.primary },
  bulletDone: { backgroundColor: colors.success },
  labelActive: { fontWeight: '700' },
  line: { width: 18, height: 2, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  lineDone: { backgroundColor: colors.success },
});
