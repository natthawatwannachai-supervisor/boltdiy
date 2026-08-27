import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

/** สถานะว่าง — บอกครูเสมอว่าก้าวถัดไปคืออะไร ไม่ปล่อยหน้าจอโล่ง */
export function EmptyState({
  emoji = '🎬',
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="h3" center>
        {title}
      </Text>
      {description ? (
        <Text variant="small" color={colors.textSecondary} center style={styles.description}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

export function LoadingState({ message = 'กำลังโหลด…' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="small" color={colors.textSecondary} style={styles.description}>
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  title = 'เกิดข้อผิดพลาด',
  message,
  onRetry,
  actionLabel = 'ลองใหม่',
  extra,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      <Text variant="small" color={colors.textSecondary} center style={styles.description}>
        {message}
      </Text>
      {onRetry ? (
        <Button
          label={actionLabel}
          icon="refresh"
          variant="secondary"
          onPress={onRetry}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
      {extra}
    </View>
  );
}

export function SuccessState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={40} color={colors.success} />
      </View>
      <Text variant="h2" center>
        {title}
      </Text>
      {description ? (
        <Text variant="small" color={colors.textSecondary} center style={styles.description}>
          {description}
        </Text>
      ) : null}
      <View style={styles.successActions}>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
        {secondaryLabel && onSecondary ? (
          <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.sm,
    flexGrow: 1,
  },
  emoji: { fontSize: 44, lineHeight: 54 },
  description: { maxWidth: 320 },
  action: { marginTop: spacing.md },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successActions: { marginTop: spacing.lg, width: '100%', gap: spacing.sm },
});
