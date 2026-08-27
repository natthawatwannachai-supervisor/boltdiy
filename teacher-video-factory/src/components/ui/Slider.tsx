import { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

/**
 * แถบเลื่อนสำหรับปรับความเร็ว / Pitch / ความดังของเสียงบรรยาย
 * เขียนเองด้วย PanResponder เพื่อไม่ต้องพึ่ง native module เพิ่ม
 */
export function Slider({ label, value, min, max, step = 0.05, onChange, formatValue }: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    widthRef.current = next;
    setWidth(next);
  };

  const applyFromX = useCallback(
    (x: number) => {
      if (widthRef.current <= 0) {
        return;
      }

      const ratio = Math.min(1, Math.max(0, x / widthRef.current));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;

      onChange(Number(Math.min(max, Math.max(min, stepped)).toFixed(2)));
    },
    [max, min, onChange, step],
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => applyFromX(event.nativeEvent.locationX),
      onPanResponderMove: (event, gesture) => applyFromX(event.nativeEvent.locationX + gesture.dx * 0),
    }),
  ).current;

  const ratio = max === min ? 0 : (value - min) / (max - min);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text variant="small" color={colors.textSecondary}>
          {label}
        </Text>
        <Text variant="small" color={colors.primary}>
          {formatValue ? formatValue(value) : value.toFixed(2)}
        </Text>
      </View>
      <View
        style={styles.track}
        onLayout={onLayout}
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: value }}
        {...responder.panHandlers}
      >
        <View style={styles.rail} />
        <View style={[styles.fill, { width: Math.max(0, ratio * width) }]} />
        <View style={[styles.thumb, { left: Math.max(0, ratio * width - 11) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm, paddingVertical: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  track: {
    height: 32,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  rail: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    position: 'absolute',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
  },
});
