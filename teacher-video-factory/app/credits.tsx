import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import { Badge, Button, Card, EmptyState, GradientHeader, Text, useToast } from '@/components/ui';
import { CREDIT_ACTION_LABEL, CREDIT_COSTS, CREDIT_PACKS, type CreditAction } from '@/constants/billing';
import { createCreditCheckout } from '@/lib/api/billing';
import { listCreditTransactions } from '@/lib/api/credits';
import { queryKeys } from '@/lib/queryClient';
import { useWallet } from '@/store/session';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { formatNumber, formatRelativeTime, formatTHB } from '@/utils/format';

const COST_ROWS = (Object.keys(CREDIT_COSTS) as CreditAction[]).filter(
  (action) => action !== 'lesson_kit' && action !== 'assistant',
);

export default function CreditsScreen() {
  const toast = useToast();
  const wallet = useWallet();

  const history = useQuery({ queryKey: queryKeys.creditHistory(), queryFn: () => listCreditTransactions(30) });

  const buy = useMutation({
    mutationFn: (packId: string) => createCreditCheckout(packId),
    onSuccess: async (result, packId) => {
      track('checkout_started', { kind: 'credits', pack_id: packId });
      await Linking.openURL(result.checkout_url);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <View style={styles.flex}>
      <GradientHeader title="เครดิตของฉัน" subtitle="ใช้เครดิตกับทุกการเรียกใช้ AI" showBack tone="ai">
        <Card style={styles.balanceCard}>
          <Text variant="small" color={colors.textSecondary}>
            เครดิตคงเหลือ
          </Text>
          <View style={styles.balanceRow}>
            <Ionicons name="sparkles" size={28} color={colors.accent} />
            <Text variant="display" color={colors.accent}>
              {formatNumber(wallet?.balance ?? 0)}
            </Text>
          </View>
          {wallet?.monthly_grant ? (
            <Text variant="caption" color={colors.textMuted}>
              รับฟรี {formatNumber(wallet.monthly_grant)} เครดิตทุกเดือนตามแพ็กเกจของคุณ
            </Text>
          ) : null}
        </Card>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text variant="h3">💎 ซื้อเครดิตเพิ่ม</Text>
          {CREDIT_PACKS.map((pack) => (
            <Card key={pack.id} style={styles.packCard}>
              <View style={styles.packInfo}>
                <View style={styles.packTitle}>
                  <Text variant="h3">{formatNumber(pack.credits)} เครดิต</Text>
                  {pack.bonusLabel ? <Badge label={pack.bonusLabel} tone="success" /> : null}
                </View>
                <Text variant="small" color={colors.textSecondary}>
                  {formatTHB(pack.priceTHB)} · เฉลี่ย {(pack.priceTHB / pack.credits).toFixed(2)} บาท/เครดิต
                </Text>
              </View>
              <Button
                label="ซื้อ"
                size="sm"
                fullWidth={false}
                loading={buy.isPending && buy.variables === pack.id}
                onPress={() => buy.mutate(pack.id)}
              />
            </Card>
          ))}
          <Button label="หรืออัปเกรดแพ็กเกจรายเดือน" variant="premium" icon="rocket-outline" onPress={() => router.push('/subscription')} />
        </View>

        <View style={styles.section}>
          <Text variant="h3">📊 อัตราการใช้เครดิต</Text>
          <Card padded={false} style={styles.costCard}>
            {COST_ROWS.map((action, index) => (
              <View key={action} style={[styles.costRow, index > 0 && styles.costRowBordered]}>
                <Text variant="small">{CREDIT_ACTION_LABEL[action]}</Text>
                <Badge label={`${CREDIT_COSTS[action]} เครดิต`} tone="primary" />
              </View>
            ))}
          </Card>
          <Text variant="caption" color={colors.textMuted}>
            ภาพและเสียงคิดตามจำนวนฉาก — วิดีโอ 5 นาที (ราว 14 ฉาก) ใช้ประมาณ 65 เครดิต
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3">🧾 ประวัติการใช้เครดิต</Text>
          {(history.data?.length ?? 0) === 0 ? (
            <Card>
              <EmptyState emoji="🧾" title="ยังไม่มีประวัติ" description="เมื่อคุณเริ่มใช้ AI รายการจะแสดงที่นี่" />
            </Card>
          ) : (
            <Card padded={false} style={styles.costCard}>
              {history.data?.map((item, index) => (
                <View key={item.id} style={[styles.historyRow, index > 0 && styles.costRowBordered]}>
                  <View style={styles.historyInfo}>
                    <Text variant="small">{item.reason}</Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {formatRelativeTime(item.created_at)} · คงเหลือ {formatNumber(item.balance_after)}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" color={item.amount >= 0 ? colors.success : colors.danger}>
                    {item.amount >= 0 ? '+' : ''}
                    {formatNumber(item.amount)}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  balanceCard: { alignItems: 'center', gap: spacing.xs },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing['2xl'], paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md },
  packCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  packInfo: { flex: 1, gap: 2 },
  packTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  costCard: { overflow: 'hidden', borderRadius: radius.xl },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  costRowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historyInfo: { flex: 1, gap: 2 },
});
