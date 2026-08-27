import { Share, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import { Badge, Button, Card, EmptyState, GradientHeader, Text, useToast } from '@/components/ui';
import { REFERRAL_REWARD } from '@/constants/billing';
import { listReferrals } from '@/lib/api/referrals';
import { queryKeys } from '@/lib/queryClient';
import { useProfile } from '@/store/session';
import { track } from '@/lib/api/analytics';
import { formatRelativeTime } from '@/utils/format';

export default function ReferralScreen() {
  const toast = useToast();
  const profile = useProfile();
  const referrals = useQuery({ queryKey: queryKeys.referrals(), queryFn: listReferrals });

  const code = profile?.referral_code ?? '—';
  const earned =
    (referrals.data?.filter((r) => r.signup_rewarded).length ?? 0) * REFERRAL_REWARD.signup +
    (referrals.data?.filter((r) => r.upgrade_rewarded).length ?? 0) * REFERRAL_REWARD.upgrade;

  const shareCode = async () => {
    track('referral_shared', {});
    await Share.share({
      message: `ผมใช้ Teacher Video Factory สร้างวิดีโอการสอนด้วย AI จากหัวข้อเดียว ลองใช้ดูครับ ใส่รหัสแนะนำ ${code} รับเครดิตฟรีตอนสมัคร`,
    });
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="🎁 เชิญเพื่อนรับเครดิต" subtitle="ชวนเพื่อนครูมาลดเวลาเตรียมสื่อไปด้วยกัน" showBack tone="ai">
        <Card style={styles.codeCard}>
          <Text variant="small" color={colors.textSecondary}>
            รหัสแนะนำของคุณ
          </Text>
          <Text variant="display" color={colors.primary}>
            {code}
          </Text>
          <View style={styles.codeActions}>
            <Button
              label="คัดลอกรหัส"
              variant="secondary"
              icon="copy-outline"
              fullWidth={false}
              onPress={async () => {
                await Clipboard.setStringAsync(code);
                toast.success('คัดลอกรหัสแล้ว');
              }}
            />
            <Button label="แชร์" icon="share-social-outline" fullWidth={false} onPress={() => void shareCode()} />
          </View>
        </Card>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.rewardCard}>
          <Text variant="h3">คุณได้อะไรบ้าง</Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardIcon}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rewardText}>
              <Text variant="bodyStrong">เพื่อนสมัครสมาชิก</Text>
              <Text variant="small" color={colors.textSecondary}>
                รับ {REFERRAL_REWARD.signup} เครดิตทันที
              </Text>
            </View>
          </View>
          <View style={styles.rewardRow}>
            <View style={styles.rewardIcon}>
              <Ionicons name="rocket-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.rewardText}>
              <Text variant="bodyStrong">เพื่อนอัปเกรดเป็น Premium</Text>
              <Text variant="small" color={colors.textSecondary}>
                รับเพิ่มอีก {REFERRAL_REWARD.upgrade} เครดิต
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text variant="h2" color={colors.primary}>
              {referrals.data?.length ?? 0}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              เพื่อนที่สมัครแล้ว
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="h2" color={colors.accent}>
              {earned}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              เครดิตที่ได้รับ
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text variant="h3">รายชื่อเพื่อนที่เชิญ</Text>
          {(referrals.data?.length ?? 0) === 0 ? (
            <Card>
              <EmptyState
                emoji="👥"
                title="ยังไม่มีเพื่อนใช้รหัสของคุณ"
                description="แชร์รหัสให้เพื่อนครูในกลุ่มสาระหรือกลุ่มไลน์โรงเรียน"
                actionLabel="แชร์รหัสเลย"
                onAction={() => void shareCode()}
              />
            </Card>
          ) : (
            referrals.data?.map((referral) => (
              <Card key={referral.id} style={styles.referralRow}>
                <View style={styles.referralInfo}>
                  <Text variant="bodyStrong">สมัครเมื่อ {formatRelativeTime(referral.created_at)}</Text>
                  <Text variant="caption" color={colors.textMuted}>
                    รหัส {referral.code}
                  </Text>
                </View>
                <View style={styles.referralBadges}>
                  {referral.signup_rewarded ? <Badge label={`+${REFERRAL_REWARD.signup}`} tone="success" /> : null}
                  {referral.upgrade_rewarded ? <Badge label={`+${REFERRAL_REWARD.upgrade}`} tone="ai" /> : null}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  codeCard: { alignItems: 'center', gap: spacing.sm },
  codeActions: { flexDirection: 'row', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  rewardCard: { gap: spacing.md },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardText: { flex: 1, gap: 2 },
  summaryCard: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  section: { gap: spacing.md },
  referralRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  referralInfo: { flex: 1, gap: 2 },
  referralBadges: { flexDirection: 'row', gap: spacing.xs },
});
