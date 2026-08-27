import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '@/theme';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  height?: number;
  tone?: 'brand' | 'ai' | 'success';
}

export function ProgressBar({ value, height = 10, tone = 'ai' }: ProgressBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(100, Math.max(0, value)), { duration: 450 });
  }, [progress, value]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(value), min: 0, max: 100 }}
      style={[styles.track, { height, borderRadius: height }]}
    >
      <Animated.View style={[styles.fill, { borderRadius: height }, animatedStyle]}>
        <LinearGradient
          colors={[...gradients[tone]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.surfaceMuted, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', overflow: 'hidden', borderRadius: radius.pill },
});
