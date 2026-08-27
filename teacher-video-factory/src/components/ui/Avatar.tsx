import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '@/theme';
import { Text } from './Text';

export function Avatar({
  uri,
  initials,
  size = 44,
}: {
  uri?: string | null;
  initials: string;
  size?: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius.pill }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <LinearGradient
      colors={[...gradients.ai]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fallback, { width: size, height: size }]}
    >
      <Text variant="bodyStrong" color={colors.onPrimary} style={{ fontSize: size * 0.38 }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});

export function AvatarStack({ children }: { children: React.ReactNode }) {
  return <View style={styles.fallback}>{children}</View>;
}
