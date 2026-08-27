import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scrollable = false,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}) {
  const content = segments.map((segment) => {
    const active = segment.value === value;

    return (
      <Pressable
        key={segment.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(segment.value)}
        style={[styles.segment, active && styles.segmentActive, scrollable && styles.segmentScrollable]}
      >
        <Text variant="small" color={active ? colors.primary : colors.textSecondary} style={active ? styles.labelActive : undefined}>
          {segment.label}
          {segment.count !== undefined ? ` (${segment.count})` : ''}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollTrack}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.track}>{content}</View>;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  scrollTrack: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 2 },
  segment: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  segmentScrollable: {
    flex: 0,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentActive: { backgroundColor: colors.surface, borderColor: colors.primary },
  labelActive: { fontWeight: '700' },
});
