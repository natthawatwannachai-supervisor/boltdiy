import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Button, Input, Screen, Text } from '@/components/ui';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/api/auth';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';

export default function PhoneSignInScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [normalized, setNormalized] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!/^0\d{8,9}$/.test(phone.replace(/[^0-9]/g, ''))) {
      setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก เช่น 0812345678');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      setNormalized(await sendPhoneOtp(phone));
      setStep('otp');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (otp.length < 6) {
      setError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyPhoneOtp(normalized, otp);
      track('signup_completed', { method: 'phone' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1">{step === 'phone' ? 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' : 'ยืนยันรหัส OTP'}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {step === 'phone'
              ? 'เราจะส่งรหัสยืนยัน 6 หลักไปที่เบอร์ของคุณ'
              : `ส่งรหัสไปที่ ${phone} แล้ว`}
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Input
              label="เบอร์โทรศัพท์"
              required
              value={phone}
              onChangeText={setPhone}
              placeholder="0812345678"
              keyboardType="phone-pad"
              icon="call-outline"
              maxLength={10}
              error={error}
            />
            <Button label="ส่งรหัส OTP" loading={loading} onPress={() => void requestOtp()} />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="รหัส OTP"
              required
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              icon="keypad-outline"
              error={error}
            />
            <Button label="ยืนยัน" loading={loading} onPress={() => void verify()} />
            <Button
              label="เปลี่ยนเบอร์โทรศัพท์"
              variant="ghost"
              onPress={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing['2xl'], paddingTop: spacing['3xl'] },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
});
