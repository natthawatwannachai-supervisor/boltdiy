import { ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import { Card, ErrorState, GradientHeader, LoadingState, Text } from '@/components/ui';
import { BarChart, StatTile } from '@/components/domain/BarChart';
import { getAdminDailyStats, getAdminOverview, getUsageInsights } from '@/lib/api/admin';
import { queryKeys } from '@/lib/queryClient';
import { useIsAdmin } from '@/store/session';
import { errorMessage } from '@/lib/errors';
import { formatNumber, formatTHB } from '@/utils/format';

/** Dashboard ผู้ดูแล §28–29 — สมาชิก รายได้ ต้นทุน AI และพฤติกรรมการใช้งาน */
export default function AdminDashboardScreen() {
  const isAdmin = useIsAdmin();
  const overview = useQuery({ queryKey: queryKeys.adminOverview(), queryFn: getAdminOverview, enabled: isAdmin });
  const daily = useQuery({ queryKey: queryKeys.adminDaily(), queryFn: () => getAdminDailyStats(30), enabled: isAdmin });
  const insights = useQuery({ queryKey: ['admin', 'insights'], queryFn: getUsageInsights, enabled: isAdmin });

  if (!isAdmin) {
    return (
      <ErrorState
        title="ไม่มีสิทธิ์เข้าถึง"
        message="หน้านี้สำหรับผู้ดูแลระบบเท่านั้น"
      />
    );
  }

  if (overview.isLoading) {
    return <LoadingState message="กำลังโหลดข้อมูลภาพรวม…" />;
  }

  if (overview.isError || !overview.data) {
    return <ErrorState message={errorMessage(overview.error)} onRetry={() => void overview.refetch()} />;
  }

  const data = overview.data;
  const dailyPoints = daily.data ?? [];

  const groupedInsights = (insights.data ?? []).reduce<Record<string, { label: string; value: number }[]>>(
    (acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), { label: item.label, value: item.value }];
      return acc;
    },
    {},
  );

  return (
    <View style={styles.flex}>
      <GradientHeader title="Dashboard ผู้ดูแลระบบ" subtitle="ภาพรวมธุรกิจและการใช้งาน 30 วันล่าสุด" showBack tone="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tiles}>
          <StatTile label="สมาชิกทั้งหมด" value={formatNumber(data.total_users)} />
          <StatTile label="Active Users (30 วัน)" value={formatNumber(data.active_users_30d)} tone={colors.info} />
          <StatTile label="สมาชิกฟรี" value={formatNumber(data.free_users)} tone={colors.textSecondary} />
          <StatTile label="สมาชิก Premium" value={formatNumber(data.paid_users)} tone={colors.accent} />
          <StatTile label="รายได้ต่อเดือน (MRR)" value={formatTHB(data.mrr_thb)} tone={colors.success} />
          <StatTile label="ต้นทุน AI (30 วัน)" value={formatTHB(data.ai_cost_thb_30d)} tone={colors.warning} />
          <StatTile label="วิดีโอทั้งหมด" value={formatNumber(data.videos_total)} hint={`30 วันล่าสุด ${formatNumber(data.videos_30d)}`} />
          <StatTile label="เครดิตที่ใช้ (30 วัน)" value={formatNumber(data.credits_spent_30d)} tone={colors.accent} />
          <StatTile label="Conversion Rate" value={`${data.conversion_rate.toFixed(1)}%`} hint="เป้าหมาย 5%" tone={data.conversion_rate >= 5 ? colors.success : colors.warning} />
          <StatTile label="Churn Rate" value={`${data.churn_rate.toFixed(1)}%`} tone={data.churn_rate <= 5 ? colors.success : colors.danger} />
        </View>

        <BarChart
          title="สมาชิกใหม่รายวัน"
          points={dailyPoints.map((point) => ({ label: point.day.slice(5), value: point.signups }))}
          suffix=" คน"
        />
        <BarChart
          title="วิดีโอที่สร้างรายวัน"
          points={dailyPoints.map((point) => ({ label: point.day.slice(5), value: point.videos_created }))}
          suffix=" คลิป"
        />
        <BarChart
          title="รายได้รายวัน (บาท)"
          points={dailyPoints.map((point) => ({ label: point.day.slice(5), value: point.revenue_thb }))}
          suffix=" บาท"
        />

        {Object.entries(groupedInsights).map(([group, items]) => (
          <Card key={group} style={styles.insightCard}>
            <Text variant="h3">{group}</Text>
            {items.map((item) => (
              <View key={item.label} style={styles.insightRow}>
                <Text variant="small" style={styles.insightLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text variant="bodyStrong" color={colors.primary}>
                  {formatNumber(item.value)}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  insightCard: { gap: spacing.sm },
  insightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  insightLabel: { flex: 1 },
});
