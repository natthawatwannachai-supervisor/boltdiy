import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '@/theme';
import { Text } from './Text';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TINTS: Record<ToastTone, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.primary,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();

    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 3600);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.sm }]}>
        {items.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={styles.toast}
          >
            <Ionicons name={ICONS[item.tone]} size={20} color={TINTS[item.tone]} />
            <Text variant="small" style={styles.message}>
              {item.message}
            </Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast ต้องอยู่ภายใน ToastProvider');
  }

  return context;
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.raised,
  },
  message: { flex: 1 },
});
