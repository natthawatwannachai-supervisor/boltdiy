import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '@/theme';
import { Button, Sheet, Text } from '@/components/ui';
import { CREDIT_ACTION_LABEL, type CreditAction } from '@/constants/billing';
import { th } from '@/i18n/th';

export function InsufficientCreditsSheet({
  visible,
  required,
  balance,
  action,
  onClose,
}: {
  visible: boolean;
  required: number;
  balance: number;
  action: CreditAction | null;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={th.credits.insufficientTitle} scroll={false}>
      <View style={{ gap: spacing.lg }}>
        <Text variant="body" color={colors.textSecondary}>
          {action ? `${CREDIT_ACTION_LABEL[action]} — ` : ''}
          {th.credits.insufficientBody(required, balance)}
        </Text>
        <Button
          label={th.action.buyCredits}
          icon="sparkles"
          onPress={() => {
            onClose();
            router.push('/credits');
          }}
        />
        <Button
          label={th.action.upgrade}
          variant="premium"
          icon="rocket-outline"
          onPress={() => {
            onClose();
            router.push('/subscription');
          }}
        />
        <Button label={th.action.close} variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}
