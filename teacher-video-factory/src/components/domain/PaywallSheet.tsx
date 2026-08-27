import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '@/theme';
import { Badge, Button, Sheet, Text } from '@/components/ui';
import type { Plan } from '@/constants/billing';
import { formatTHB } from '@/utils/format';
import { track } from '@/lib/api/analytics';

/** ใช้เมื่อครูกดฟีเจอร์ที่แพ็กเกจปัจจุบันยังไม่รองรับ */
export function PaywallSheet({
  visible,
  onClose,
  title,
  reason,
  suggestedPlan,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  reason: string;
  suggestedPlan: Plan | null;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} subtitle={reason}>
      {suggestedPlan ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="h2">{suggestedPlan.name}</Text>
            <Badge label={formatTHB(suggestedPlan.priceTHB) + '/เดือน'} tone="ai" />
          </View>
          <Text variant="small" color={colors.textSecondary}>
            {suggestedPlan.tagline}
          </Text>
          <View style={{ gap: spacing.xs }}>
            {suggestedPlan.features.map((feature) => (
              <Text key={feature} variant="small">
                ✓ {feature}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <Button
        label="ดูแพ็กเกจทั้งหมด"
        variant="premium"
        icon="rocket-outline"
        onPress={() => {
          track('paywall_viewed', { reason });
          onClose();
          router.push('/subscription');
        }}
      />
      <Button label="ไว้ก่อน" variant="ghost" onPress={onClose} />
    </Sheet>
  );
}
