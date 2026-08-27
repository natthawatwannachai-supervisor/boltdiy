import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** ความสูงสูงสุดเป็นสัดส่วนของหน้าจอ */
  maxHeightRatio?: number;
  scroll?: boolean;
}

/** Bottom sheet มาตรฐานของแอป ใช้กับตัวเลือก, paywall และ dialog ยืนยัน */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeightRatio = 0.85,
  scroll = true,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="ปิด" />
      <View style={[styles.sheet, { maxHeight: `${maxHeightRatio * 100}%`, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="h2">{title}</Text>
              {subtitle ? (
                <Text variant="small" color={colors.textSecondary}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="ปิด">
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
        <Body
          style={styles.body}
          contentContainerStyle={scroll ? styles.bodyContent : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Body>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  headerText: { flex: 1, gap: 2 },
  body: { flexGrow: 0 },
  bodyContent: { paddingBottom: spacing.md, gap: spacing.md },
});
