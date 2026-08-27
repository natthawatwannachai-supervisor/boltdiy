import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Button, Card, ConfirmDialog, GradientHeader, Text, useToast } from '@/components/ui';
import { PlanCard } from '@/components/domain/PlanCard';
import { PLANS } from '@/constants/billing';
import { cancelSubscription, createSubscriptionCheckout, openBillingPortal } from '@/lib/api/billing';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore, useSubscription } from '@/store/session';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { formatThaiDate } from '@/utils/format';
import type { PlanKey } from '@/types/domain';

export default function SubscriptionScreen() {
  const toast = useToast();
  const subscription = useSubscription();
  const setSubscription = useSessionStore((state) => state.setSubscription);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const checkout = useMutation({
    mutationFn: (plan: PlanKey) => createSubscriptionCheckout(plan),
    onSuccess: async (result, plan) => {
      track('checkout_started', { kind: 'subscription', plan });
      await Linking.openURL(result.checkout_url);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const portal = useMutation({
    mutationFn: openBillingPortal,
    onSuccess: async (result) => Linking.openURL(result.portal_url),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (result) => {
      setSubscription(result.subscription);
      setConfirmCancel(false);
      toast.success('ยกเลิกการต่ออายุแล้ว คุณใช้งานได้จนจบรอบบิลปัจจุบัน');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const currentPlan = subscription?.plan ?? 'free';

  return (
    <View style={styles.flex}>
      <GradientHeader
        title="แพ็กเกจการใช้งาน"
        subtitle="เลือกแพ็กเกจที่เหมาะกับจำนวนสื่อที่คุณผลิตในแต่ละเดือน"
        showBack
        tone="premium"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {subscription && subscription.plan !== 'free' ? (
          <Card tone="outlined" style={styles.statusCard}>
            <Text variant="bodyStrong">สถานะการสมัครสมาชิก</Text>
            <Text variant="small" color={colors.textSecondary}>
              รอบบิลปัจจุบันสิ้นสุด {formatThaiDate(subscription.current_period_end)}
              {subscription.cancel_at_period_end ? ' · จะไม่ต่ออายุอัตโนมัติ' : ''}
            </Text>
            <Button label="จัดการการชำระเงิน" variant="secondary" icon="card-outline" loading={portal.isPending} onPress={() => portal.mutate()} />
            {!subscription.cancel_at_period_end ? (
              <Button label="ยกเลิกการต่ออายุ" variant="ghost" onPress={() => setConfirmCancel(true)} />
            ) : null}
          </Card>
        ) : null}

        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            current={plan.key === currentPlan}
            loading={checkout.isPending && checkout.variables === plan.key}
            onSelect={() => checkout.mutate(plan.key)}
          />
        ))}

        <Text variant="caption" color={colors.textMuted}>
          ชำระเงินผ่านผู้ให้บริการที่ได้มาตรฐาน PCI DSS แอปไม่เก็บข้อมูลบัตรของคุณ
          ยกเลิกได้ทุกเมื่อและใช้งานได้จนจบรอบบิล
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmCancel}
        title="ยกเลิกการต่ออายุ?"
        message="คุณจะยังใช้งานแพ็กเกจปัจจุบันได้จนจบรอบบิล หลังจากนั้นบัญชีจะกลับไปใช้แพ็กเกจ FREE"
        confirmLabel="ยืนยันการยกเลิก"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setConfirmCancel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  statusCard: { gap: spacing.md },
});
