import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { signUpWithEmail } from '@/lib/api/auth';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';

export default function SignUpScreen() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (!accepted) {
      setError('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signUpWithEmail(email, password, referral || undefined);
      track('signup_completed', { method: 'email', has_referral: Boolean(referral) });

      if (!result.session) {
        toast.success('ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณายืนยันก่อนเข้าใช้งาน');
        router.replace('/(auth)/sign-in');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1">สมัครสมาชิก</Text>
          <Text variant="small" color={colors.textSecondary}>
            เริ่มต้นฟรี 3 วิดีโอ/เดือน ไม่ต้องผูกบัตรเครดิต
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="อีเมล"
            required
            value={email}
            onChangeText={setEmail}
            placeholder="teacher@school.ac.th"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="mail-outline"
          />
          <Input
            label="รหัสผ่าน"
            required
            value={password}
            onChangeText={setPassword}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            icon="lock-closed-outline"
            secureToggle
            helper="ใช้ตัวอักษรผสมตัวเลขเพื่อความปลอดภัย"
          />

          {showReferral ? (
            <Input
              label="รหัสแนะนำเพื่อน (ถ้ามี)"
              value={referral}
              onChangeText={(text) => setReferral(text.toUpperCase())}
              placeholder="เช่น TEACH1234"
              autoCapitalize="characters"
              icon="gift-outline"
              helper="กรอกรหัสเพื่อรับเครดิตเพิ่มเมื่อสมัครสำเร็จ"
            />
          ) : (
            <Button label="มีรหัสแนะนำเพื่อน" variant="ghost" onPress={() => setShowReferral(true)} />
          )}

          <Pressable style={styles.consent} onPress={() => setAccepted((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
            <Ionicons
              name={accepted ? 'checkbox' : 'square-outline'}
              size={22}
              color={accepted ? colors.primary : colors.textMuted}
            />
            <Text variant="small" style={styles.consentText}>
              ฉันยอมรับ{' '}
              <Text variant="small" color={colors.primary} onPress={() => router.push('/legal')}>
                ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
              </Text>
            </Text>
          </Pressable>

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button label="สมัครสมาชิก" loading={loading} onPress={() => void submit()} />
        </View>

        <View style={styles.footer}>
          <Text variant="small" color={colors.textSecondary}>
            มีบัญชีอยู่แล้ว?
          </Text>
          <Button label="เข้าสู่ระบบ" variant="secondary" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing['2xl'], paddingTop: spacing['3xl'] },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  consentText: { flex: 1 },
  footer: { gap: spacing.sm, marginTop: 'auto' },
});
