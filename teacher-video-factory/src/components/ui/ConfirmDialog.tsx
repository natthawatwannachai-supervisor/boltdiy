import { View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onCancel} title={title} scroll={false}>
      <View style={{ gap: spacing.lg }}>
        <Text variant="body">{message}</Text>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          loading={loading}
          onPress={onConfirm}
        />
        <Button label={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} />
      </View>
    </Sheet>
  );
}
