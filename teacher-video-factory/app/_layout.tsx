import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from '@/components/ui';
import { queryClient } from '@/lib/queryClient';
import { useBootstrapSession } from '@/hooks/useBootstrapSession';
import { useSessionStore } from '@/store/session';
import { registerForPushNotifications } from '@/lib/notifications';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/** ตัดสินใจว่าผู้ใช้ควรอยู่กลุ่มหน้าจอไหน: ยังไม่ล็อกอิน / ยังไม่กรอกโปรไฟล์ / ใช้งานปกติ */
function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const initialized = useSessionStore((state) => state.initialized);
  const session = useSessionStore((state) => state.session);
  const profile = useSessionStore((state) => state.profile);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    void SplashScreen.hideAsync();

    const path = segments as string[];
    const inAuthGroup = path[0] === '(auth)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }

      return;
    }

    // ล็อกอินแล้วแต่ยังไม่ได้กรอกข้อมูลครู — บังคับให้ทำ onboarding ให้จบก่อน
    if (profile && !profile.onboarded_at) {
      if (path[1] !== 'onboarding') {
        router.replace('/(auth)/onboarding');
      }

      return;
    }

    if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [initialized, profile, router, segments, session]);
}

function useRegisterPush() {
  const userId = useSessionStore((state) => state.session?.user.id ?? null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void registerForPushNotifications(userId).catch(() => {
      // ผู้ใช้ปฏิเสธสิทธิ์แจ้งเตือนได้ ไม่ถือเป็นข้อผิดพลาดที่ต้องแจ้ง
    });
  }, [userId]);
}

function RootNavigator() {
  useBootstrapSession();
  useAuthGate();
  useRegisterPush();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wizard" />
      <Stack.Screen name="video" />
      <Stack.Screen name="assistant" options={{ presentation: 'modal' }} />
      <Stack.Screen name="credits" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
