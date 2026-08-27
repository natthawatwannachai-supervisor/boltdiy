import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import type { Option } from '@/constants/lesson';
import { Text } from './Text';

interface ChipGroupProps<T extends string> {
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple?: boolean;
  label?: string;
}

/** ชิปเลือกหลายค่า ใช้กับ "วิชาที่สอน" และ "ระดับชั้นที่สอน" */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = true,
  label,
}: ChipGroupProps<T>) {
  const toggle = (key: T) => {
    if (!multiple) {
      onChange([key]);
      return;
    }

    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text variant="bodyStrong">{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((option) => {
          const active = value.includes(option.value);

          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              {active ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
              <Text variant="small" color={active ? colors.primary : colors.textSecondary}>
                {option.emoji ? `${option.emoji} ` : ''}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
});
