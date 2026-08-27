import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function VideoLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
