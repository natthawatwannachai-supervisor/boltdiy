import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '@/theme';
import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { sendPasswordReset, signInWithEmail } from '@/lib/api/auth';
import { errorMessage } from '@/lib/errors';

export default function SignInScreen() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      // การเปลี่ยนหน้าเกิดขึ้นอัตโนมัติจาก useAuthGate เมื่อ session ถูกตั้งค่า
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError('กรอกอีเมลของคุณก่อน แล้วกดลืมรหัสผ่านอีกครั้ง');
      return;
    }

    try {
      await sendPasswordReset(email);
      toast.success('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1">เข้าสู่ระบบ</Text>
          <Text variant="small" color={colors.textSecondary}>
            ยินดีต้อนรับกลับ พร้อมผลิตสื่อการสอนต่อหรือยัง?
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="อีเมล"
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
            value={password}
            onChangeText={setPassword}
            placeholder="รหัสผ่านของคุณ"
            icon="lock-closed-outline"
            secureToggle
            error={error}
          />
          <Button label="เข้าสู่ระบบ" loading={loading} onPress={() => void submit()} />
          <Button label="ลืมรหัสผ่าน?" variant="ghost" onPress={() => void resetPassword()} />
        </View>

        <View style={styles.footer}>
          <Text variant="small" color={colors.textSecondary}>
            ยังไม่มีบัญชี?
          </Text>
          <Button label="สมัครสมาชิกฟรี" variant="secondary" onPress={() => router.replace('/(auth)/sign-up')} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing['2xl'], paddingTop: spacing['3xl'] },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  footer: { gap: spacing.sm, marginTop: 'auto' },
});
