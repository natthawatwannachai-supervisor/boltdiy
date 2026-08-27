import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import type { Option } from '@/constants/lesson';
import { Sheet } from './Sheet';
import { Text } from './Text';

interface SelectProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  error?: string | null;
  sheetTitle?: string;
}

/** Dropdown ที่เปิดเป็น bottom sheet — กดง่ายกว่า picker มาตรฐานบนมือถือ */
export function Select<T extends string>({
  label,
  placeholder = 'เลือก…',
  value,
  options,
  onChange,
  required,
  error,
  sheetTitle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="bodyStrong">
          {label}
          {required ? <Text color={colors.danger}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, Boolean(error) && styles.fieldError, pressed && styles.pressed]}
      >
        <Text
          variant="body"
          color={selected ? colors.text : colors.textMuted}
          style={styles.value}
          numberOfLines={1}
        >
          {selected ? `${selected.emoji ? `${selected.emoji} ` : ''}${selected.label}` : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <Text variant="small" color={colors.danger}>
          {error}
        </Text>
      ) : null}

      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? label ?? 'เลือกตัวเลือก'}>
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
            >
              <View style={styles.optionText}>
                <Text variant="bodyStrong" color={active ? colors.primary : colors.text}>
                  {option.emoji ? `${option.emoji} ` : ''}
                  {option.label}
                </Text>
                {option.hint ? (
                  <Text variant="small" color={colors.textSecondary}>
                    {option.hint}
                  </Text>
                ) : null}
              </View>
              {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  value: { flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  optionActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  optionText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
});
