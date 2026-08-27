import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '@/theme';
import { Badge, Text } from '@/components/ui';
import { formatSceneRange } from '@/utils/format';
import type { Scene } from '@/types/domain';

const ROW_HEIGHT = 116;
const GAP = spacing.md;
const SLOT = ROW_HEIGHT + GAP;

interface StoryboardTimelineProps {
  scenes: Scene[];
  onReorder: (orderedIds: string[]) => void;
  onPressScene: (scene: Scene) => void;
}

/**
 * Timeline ของ Storyboard ที่ลากสลับลำดับฉากได้
 * ตำแหน่งของทุกแถวเก็บเป็น shared value เพื่อให้การลากลื่นบน UI thread
 */
export function StoryboardTimeline({ scenes, onReorder, onPressScene }: StoryboardTimelineProps) {
  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(scenes.map((scene, index) => [scene.id, index])),
  );

  useEffect(() => {
    positions.value = Object.fromEntries(scenes.map((scene, index) => [scene.id, index]));
  }, [positions, scenes]);

  const commit = (next: Record<string, number>) => {
    const ordered = Object.entries(next)
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);

    onReorder(ordered);
  };

  return (
    <View style={[styles.container, { height: scenes.length * SLOT }]}>
      {scenes.map((scene) => (
        <TimelineRow
          key={scene.id}
          scene={scene}
          count={scenes.length}
          positions={positions}
          onCommit={commit}
          onPress={() => onPressScene(scene)}
        />
      ))}
    </View>
  );
}

function TimelineRow({
  scene,
  count,
  positions,
  onCommit,
  onPress,
}: {
  scene: Scene;
  count: number;
  positions: ReturnType<typeof useSharedValue<Record<string, number>>>;
  onCommit: (next: Record<string, number>) => void;
  onPress: () => void;
}) {
  const top = useSharedValue((positions.value[scene.id] ?? 0) * SLOT);
  const dragging = useSharedValue(false);

  useEffect(() => {
    if (!dragging.value) {
      top.value = withTiming((positions.value[scene.id] ?? 0) * SLOT, { duration: 180 });
    }
  }, [dragging, positions, scene.id, top]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((event) => {
      const startTop = (positions.value[scene.id] ?? 0) * SLOT;
      top.value = startTop + event.translationY;

      const currentIndex = positions.value[scene.id] ?? 0;
      const nextIndex = Math.min(count - 1, Math.max(0, Math.round(top.value / SLOT)));

      if (nextIndex !== currentIndex) {
        const swapped = Object.entries(positions.value).find(([, index]) => index === nextIndex);

        if (swapped) {
          positions.value = {
            ...positions.value,
            [scene.id]: nextIndex,
            [swapped[0]]: currentIndex,
          };
        }
      }
    })
    .onEnd(() => {
      dragging.value = false;
      top.value = withSpring((positions.value[scene.id] ?? 0) * SLOT, { damping: 18 });
      runOnJS(onCommit)(positions.value);
    });

  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) {
      runOnJS(onPress)();
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: dragging.value ? 20 : 1,
    transform: [{ scale: withTiming(dragging.value ? 1.03 : 1, { duration: 140 }) }],
  }));

  const ready = scene.image_status === 'ready' && Boolean(scene.image_url);

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View style={[styles.row, animatedStyle]}>
        <View style={styles.connector}>
          <View style={styles.dot} />
          <View style={styles.line} />
        </View>

        <View style={styles.card}>
          {ready ? (
            <Image source={{ uri: scene.image_url! }} style={styles.thumb} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons
                name={scene.image_status === 'generating' ? 'sparkles' : 'image-outline'}
                size={22}
                color={colors.textMuted}
              />
            </View>
          )}

          <View style={styles.info}>
            <View style={styles.infoHeader}>
              <Badge label={`Scene ${scene.index + 1}`} tone="primary" />
              <Text variant="caption" color={colors.textMuted}>
                {formatSceneRange(scene.start_sec, scene.end_sec)}
              </Text>
            </View>
            <Text variant="small" numberOfLines={2}>
              {scene.visual_description}
            </Text>
            <View style={styles.statusRow}>
              <StatusDot ok={ready} label="ภาพ" />
              <StatusDot ok={scene.audio_status === 'ready'} label="เสียง" />
              <StatusDot ok={Boolean(scene.on_screen_text)} label="ข้อความ" />
            </View>
          </View>

          <Ionicons name="reorder-three-outline" size={22} color={colors.textMuted} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, { backgroundColor: ok ? colors.success : colors.borderStrong }]} />
      <Text variant="caption" color={ok ? colors.success : colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  row: { position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT, flexDirection: 'row', gap: spacing.sm },
  connector: { width: 16, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: spacing.xl },
  line: { flex: 1, width: 2, backgroundColor: colors.border },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusRow: { flexDirection: 'row', gap: spacing.md },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
});
