import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { Option } from '@/constants/lesson';
import { Text } from './Text';

interface OptionGridProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
  columns?: number;
}

/** ตารางการ์ดตัวเลือก ใช้กับ "รูปแบบวิดีโอ" และ "สไตล์" ที่ต้องเห็นภาพรวมพร้อมกัน */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  label,
  columns = 3,
}: OptionGridProps<T>) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text variant="bodyStrong">{label}</Text> : null}
      <View style={styles.grid}>
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.item,
                { width: `${100 / columns - 2}%` },
                active && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emoji}>{option.emoji ?? '•'}</Text>
              <Text
                variant="caption"
                center
                color={active ? colors.primary : colors.textSecondary}
                numberOfLines={2}
                style={active ? styles.labelActive : undefined}
              >
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: spacing.sm },
  item: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  labelActive: { fontWeight: '700' },
  emoji: { fontSize: 22, lineHeight: 28 },
  pressed: { opacity: 0.85 },
});
