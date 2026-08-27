import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, palette, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  /** ปุ่มสลับซ่อน/แสดงรหัสผ่าน */
  secureToggle?: boolean;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helper, error, icon, secureToggle, required, style, multiline, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureToggle));

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="bodyStrong" style={styles.label}>
          {label}
          {required ? <Text color={colors.danger}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          Boolean(error) && styles.fieldError,
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[typography.body, styles.input, multiline && styles.inputMultiline, style]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10} accessibilityLabel="สลับการแสดงรหัสผ่าน">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="small" color={colors.danger} style={styles.helper}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="small" color={colors.textMuted} style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { marginBottom: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldMultiline: { alignItems: 'flex-start', paddingVertical: spacing.md, minHeight: 110 },
  fieldFocused: { borderColor: colors.primary, backgroundColor: palette.white },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.md },
  inputMultiline: { textAlignVertical: 'top', paddingTop: 0 },
  helper: { marginLeft: spacing.xs },
});
