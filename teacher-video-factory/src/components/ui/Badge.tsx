import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'ai';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: '#B45309' },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  ai: { bg: colors.accentSoft, fg: colors.accent },
};

export function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const { bg, fg } = TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text variant="caption" color={fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '600' },
});
