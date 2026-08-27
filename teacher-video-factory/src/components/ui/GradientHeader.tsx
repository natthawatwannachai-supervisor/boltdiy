import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, gradients, radius, spacing } from '@/theme';
import { Text } from './Text';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  children?: ReactNode;
  tone?: keyof typeof gradients;
}

export function GradientHeader({
  title,
  subtitle,
  right,
  showBack,
  onBack,
  children,
  tone = 'brand',
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...gradients[tone]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => (onBack ? onBack() : router.back())}
            hitSlop={12}
            accessibilityLabel="ย้อนกลับ"
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.onPrimary} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <Text variant="h2" color={colors.onPrimary} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="small" color={colors.textOnDarkMuted} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
    gap: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2 },
});
