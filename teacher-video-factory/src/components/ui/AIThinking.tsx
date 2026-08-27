import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, palette, radius, spacing } from '@/theme';
import { Text } from './Text';

function Dot({ index }: { index: number }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      index * 160,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0.6, { duration: 400, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.4 + scale.value * 0.6,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * แอนิเมชัน "AI กำลังทำงาน" ใช้ระหว่างรอผลลัพธ์จาก AI
 * ช่วยให้ครูรู้ว่าระบบยังทำงานอยู่ ไม่ใช่ค้าง
 */
export function AIThinking({
  message = '🤖 AI กำลังทำงานให้คุณ…',
  hint,
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[...gradients.ai]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orb}
      >
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Dot key={i} index={i} />
          ))}
        </View>
      </LinearGradient>
      <Text variant="bodyStrong" center>
        {message}
      </Text>
      {hint ? (
        <Text variant="small" color={colors.textSecondary} center>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing['2xl'] },
  orb: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.white },
});
