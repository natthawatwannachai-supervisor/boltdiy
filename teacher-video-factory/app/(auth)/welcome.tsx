import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing } from '@/theme';
import { Button, Text, useToast } from '@/components/ui';
import { th } from '@/i18n/th';
import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '@/lib/api/auth';
import { errorMessage } from '@/lib/errors';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const withProvider = async (provider: 'google' | 'apple') => {
    setBusy(provider);

    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithApple());
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <LinearGradient colors={[...gradients.dark]} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing['3xl'], paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🎬</Text>
          </View>
          <Text variant="display" color={colors.onPrimary} center>
            {th.marketing.headline}
          </Text>
          <Text variant="body" color={colors.textOnDarkMuted} center>
            {th.marketing.sub}
          </Text>
        </View>

        <View style={styles.bullets}>
          {th.marketing.bullets.map((bullet) => (
            <View key={bullet} style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={18} color={colors.info} />
              <Text variant="body" color={colors.onPrimary}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.promise}>
          <Text variant="h3" color={colors.onPrimary} center>
            “{th.marketing.promise}”
          </Text>
          <Text variant="small" color={colors.textOnDarkMuted} center>
            ลดเวลาการเตรียมสื่อการสอนจากหลายชั่วโมง เหลือไม่กี่นาที
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="เริ่มใช้งานฟรี"
            icon="sparkles"
            onPress={() => router.push('/(auth)/sign-up')}
            size="lg"
          />
          <Button
            label="เข้าสู่ระบบด้วย Google"
            icon="logo-google"
            variant="secondary"
            loading={busy === 'google'}
            onPress={() => void withProvider('google')}
          />
          {appleAvailable ? (
            <Button
              label="เข้าสู่ระบบด้วย Apple"
              icon="logo-apple"
              variant="secondary"
              loading={busy === 'apple'}
              onPress={() => void withProvider('apple')}
            />
          ) : null}
          <Button
            label="เข้าสู่ระบบด้วยเบอร์โทรศัพท์"
            icon="call-outline"
            variant="ghost"
            onPress={() => router.push('/(auth)/phone')}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="small" color={colors.textOnDarkMuted}>
            มีบัญชีอยู่แล้ว?
          </Text>
          <Button
            label="เข้าสู่ระบบด้วยอีเมล"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing['2xl'] },
  hero: { alignItems: 'center', gap: spacing.md },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 42, lineHeight: 52 },
  bullets: { gap: spacing.md, alignSelf: 'center' },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  promise: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actions: { gap: spacing.md },
  footer: { alignItems: 'center', gap: spacing.xs },
});
