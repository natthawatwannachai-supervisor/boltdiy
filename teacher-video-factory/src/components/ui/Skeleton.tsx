import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme';

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: ViewStyle['width']; style?: ViewStyle }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, { height, width }, animated, style]} />;
}

/** โครงร่างการ์ดวิดีโอระหว่างโหลดข้อมูล ทำให้หน้าแรกดูเร็วขึ้น */
export function VideoCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={140} style={{ borderRadius: radius.lg }} />
      <Skeleton height={18} width="70%" />
      <Skeleton height={14} width="45%" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  card: { gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl },
});
