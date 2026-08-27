import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'muted' | 'outlined';
  elevation?: keyof typeof shadows;
}

export function Card({
  children,
  onPress,
  padded = true,
  style,
  tone = 'default',
  elevation = 'card',
}: CardProps) {
  const base: ViewStyle = {
    backgroundColor: tone === 'muted' ? colors.surfaceMuted : colors.surface,
    borderRadius: radius.xl,
    padding: padded ? spacing.lg : 0,
    borderWidth: tone === 'outlined' ? 1 : 0,
    borderColor: colors.border,
  };

  if (!onPress) {
    return <View style={[base, tone === 'default' && shadows[elevation], style]}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        base,
        tone === 'default' && shadows[elevation],
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
