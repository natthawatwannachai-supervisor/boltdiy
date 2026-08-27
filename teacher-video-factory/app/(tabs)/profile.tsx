import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  GradientHeader,
  ProgressBar,
  Text,
  useToast,
} from '@/components/ui';
import { signOut } from '@/lib/api/auth';
import { useIsAdmin, useProfile, useSubscription, useWallet } from '@/store/session';
import { usePlan } from '@/hooks/usePlan';
import { gradeLabel, subjectLabel } from '@/constants/lesson';
import { formatNumber, formatThaiDate, initialsOf } from '@/utils/format';
import { errorMessage } from '@/lib/errors';
import { th } from '@/i18n/th';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
  tone?: string;
}

export default function ProfileScreen() {
  const toast = useToast();
  const profile = useProfile();
  const wallet = useWallet();
  const subscription = useSubscription();
  const isAdmin = useIsAdmin();
  const { plan, videosLeft } = usePlan();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const usedRatio =
    plan.videosPerMonth > 0
      ? ((subscription?.videos_used_this_period ?? 0) / plan.videosPerMonth) * 100
      : 0;

  const menu: MenuItem[] = [
    {
      icon: 'sparkles-outline',
      label: 'เครดิตของฉัน',
      hint: `${formatNumber(wallet?.balance ?? 0)} เครดิต`,
      onPress: () => router.push('/credits'),
    },
    {
      icon: 'rocket-outline',
      label: 'แพ็กเกจและการชำระเงิน',
      hint: plan.name,
      onPress: () => router.push('/subscription'),
    },
    { icon: 'gift-outline', label: 'เชิญเพื่อนรับเครดิต', onPress: () => router.push('/referral') },
    { icon: 'chatbubbles-outline', label: 'น้อง Teacher AI', onPress: () => router.push('/assistant') },
    { icon: 'notifications-outline', label: 'การแจ้งเตือน', onPress: () => router.push('/notifications') },
    { icon: 'settings-outline', label: th.action.settings, onPress: () => router.push('/settings') },
    { icon: 'document-text-outline', label: 'ข้อกำหนดและความเป็นส่วนตัว', onPress: () => router.push('/legal') },
  ];

  if (isAdmin) {
    menu.splice(3, 0, {
      icon: 'stats-chart-outline',
      label: 'Dashboard ผู้ดูแลระบบ',
      hint: 'สำหรับ Admin',
      onPress: () => router.push('/admin'),
      tone: colors.accent,
    });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setConfirmSignOut(false);
    }
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title={th.nav.profile} subtitle="ข้อมูลสมาชิก แพ็กเกจ และการตั้งค่า">
        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            <Avatar uri={profile?.avatar_url} initials={initialsOf(profile?.first_name, profile?.last_name)} size={56} />
            <View style={styles.identityText}>
              <Text variant="h3" numberOfLines={1}>
                {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'คุณครู'}
              </Text>
              <Text variant="small" color={colors.textSecondary} numberOfLines={1}>
                {profile?.position ?? 'ครูผู้สอน'}
                {profile?.school ? ` · ${profile.school}` : ''}
              </Text>
            </View>
            <Badge label={plan.name} tone={plan.key === 'free' ? 'neutral' : 'ai'} />
          </View>

          {(profile?.subjects?.length ?? 0) > 0 ? (
            <Text variant="caption" color={colors.textMuted}>
              สอน {profile?.subjects.map((s) => subjectLabel[s]).join(', ')}
              {profile?.grade_levels?.length
                ? ` · ${profile.grade_levels.map((g) => gradeLabel[g]).join(', ')}`
                : ''}
            </Text>
          ) : null}
        </Card>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text variant="bodyStrong">โควตาเดือนนี้</Text>
            <Text variant="small" color={colors.textSecondary}>
              เหลือ {videosLeft} จาก {plan.videosPerMonth} วิดีโอ
            </Text>
          </View>
          <ProgressBar value={usedRatio} tone={usedRatio > 85 ? 'brand' : 'ai'} />
          {subscription ? (
            <Text variant="caption" color={colors.textMuted}>
              รอบบิลถัดไป {formatThaiDate(subscription.current_period_end)}
              {subscription.cancel_at_period_end ? ' · จะสิ้นสุดเมื่อจบรอบนี้' : ''}
            </Text>
          ) : null}
          {plan.key === 'free' ? (
            <Button label="อัปเกรดเพื่อปลดล็อกทุกฟีเจอร์" variant="premium" icon="rocket-outline" onPress={() => router.push('/subscription')} />
          ) : null}
        </Card>

        <Card padded={false} style={styles.menuCard}>
          {menu.map((item, index) => (
            <View key={item.label}>
              <Card padded={false} tone="muted" style={styles.menuItemWrapper} onPress={item.onPress}>
                <View style={styles.menuItem}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={20} color={item.tone ?? colors.primary} />
                  </View>
                  <Text variant="body" style={styles.menuLabel}>
                    {item.label}
                  </Text>
                  {item.hint ? (
                    <Text variant="small" color={colors.textMuted}>
                      {item.hint}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Card>
              {index < menu.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </Card>

        <Button label="ออกจากระบบ" variant="danger" icon="log-out-outline" onPress={() => setConfirmSignOut(true)} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title="ออกจากระบบ"
        message="คุณต้องการออกจากระบบใช่หรือไม่? วิดีโอที่กำลังสร้างจะยังทำงานต่อบนเซิร์ฟเวอร์"
        confirmLabel="ออกจากระบบ"
        destructive
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  identityCard: { gap: spacing.sm },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  usageCard: { gap: spacing.md },
  usageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuCard: { overflow: 'hidden' },
  menuItemWrapper: { backgroundColor: colors.surface, borderRadius: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing['4xl'] },
});
