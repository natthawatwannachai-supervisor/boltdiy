import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import { colors, palette, radius, spacing } from '@/theme';
import { Card, Text } from '@/components/ui';
import { formatNumber } from '@/utils/format';

export interface ChartPoint {
  label: string;
  value: number;
}

/** กราฟแท่งอย่างง่ายสำหรับ Dashboard ผู้ดูแล — ไม่พึ่งไลบรารีกราฟภายนอก */
export function BarChart({
  title,
  points,
  height = 160,
  suffix = '',
}: {
  title: string;
  points: ChartPoint[];
  height?: number;
  suffix?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const barWidth = points.length > 0 ? 100 / points.length : 100;
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="small" color={colors.textSecondary}>
          รวม {formatNumber(total)}
          {suffix}
        </Text>
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.violet500} />
            <Stop offset="1" stopColor={palette.blue600} />
          </SvgGradient>
        </Defs>
        {points.map((point, index) => {
          const barHeight = (point.value / max) * (height - 8);

          return (
            <Rect
              key={`${point.label}-${index}`}
              x={index * barWidth + barWidth * 0.18}
              y={height - barHeight}
              width={barWidth * 0.64}
              height={Math.max(2, barHeight)}
              rx={1.5}
              fill="url(#barFill)"
            />
          );
        })}
      </Svg>

      <View style={styles.axis}>
        <Text variant="caption" color={colors.textMuted}>
          {points[0]?.label ?? ''}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {points[points.length - 1]?.label ?? ''}
        </Text>
      </View>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = colors.primary,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <View style={styles.tile}>
      <Text variant="caption" color={colors.textSecondary}>
        {label}
      </Text>
      <Text variant="h2" color={tone}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    gap: 2,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
