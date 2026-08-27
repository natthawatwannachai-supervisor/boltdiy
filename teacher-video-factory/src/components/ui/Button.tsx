import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, gradients, hitSize, radius, shadows, spacing, typography } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'premium';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

const HEIGHT: Record<Size, number> = {
  sm: 40,
  md: hitSize.button,
  lg: hitSize.buttonLarge,
};

const isGradient = (variant: Variant) => variant === 'primary' || variant === 'ai' || variant === 'premium';

const gradientFor = (variant: Variant) =>
  variant === 'ai' ? gradients.ai : variant === 'premium' ? gradients.premium : gradients.brand;

const flatStyle = (variant: Variant): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger };
    default:
      return {};
  }
};

const textColor = (variant: Variant) => {
  switch (variant) {
    case 'secondary':
      return colors.primary;
    case 'ghost':
      return colors.textSecondary;
    case 'danger':
      return colors.danger;
    default:
      return colors.onPrimary;
  }
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  haptic = true,
}: ButtonProps) {
  const inactive = disabled || loading;
  const tint = textColor(variant);

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={tint} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={tint} /> : null}
          <Text
            style={[typography.button, size === 'sm' && { fontSize: 14 }]}
            color={tint}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 20} color={tint} /> : null}
        </>
      )}
    </View>
  );

  const shape: ViewStyle = {
    height: HEIGHT[size],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : undefined,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={() => {
        if (haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        onPress?.();
      }}
      style={({ pressed }) => [
        shape,
        !isGradient(variant) && flatStyle(variant),
        variant === 'primary' && shadows.soft,
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isGradient(variant) ? (
        <LinearGradient
          colors={[...gradientFor(variant)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />
      ) : null}
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inactive: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
