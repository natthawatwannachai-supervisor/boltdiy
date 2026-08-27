import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import { Button, GradientHeader, Stepper, Text, useToast } from '@/components/ui';
import { LessonBriefForm, type BriefFormErrors } from '@/components/domain/LessonBriefForm';
import { PaywallSheet } from '@/components/domain/PaywallSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { createVideoFromBrief } from '@/lib/api/ai';
import { usePlan } from '@/hooks/usePlan';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { th } from '@/i18n/th';
import type { LessonBrief } from '@/types/domain';

const DEFAULT_BRIEF: LessonBrief = {
  topic: '',
  grade_level: 'p5',
  subject: 'science',
  duration_min: 5,
  format: 'lesson',
  style: 'animation',
};

/** ขั้นตอนที่ 1 ของ Wizard สำหรับครูที่อยากกรอกรายละเอียดเองตั้งแต่ต้น */
export default function NewVideoWizardScreen() {
  const toast = useToast();
  const { plan, videosLeft, canUseDuration, nextPlan } = usePlan();
  const [brief, setBrief] = useState<LessonBrief>(DEFAULT_BRIEF);
  const [errors, setErrors] = useState<BriefFormErrors>({});
  const [paywall, setPaywall] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createVideoFromBrief({ brief: { ...brief, topic: brief.topic.trim() }, auto_pilot: false }),
    onSuccess: ({ video }) => {
      track('create_started', { auto_pilot: false, manual: true });
      router.replace(`/wizard/${video.id}/objectives`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const submit = () => {
    if (brief.topic.trim().length < 2) {
      setErrors({ topic: 'กรุณากรอกหัวข้อบทเรียน' });
      return;
    }

    setErrors({});

    if (videosLeft <= 0) {
      setPaywall(`แพ็กเกจ ${plan.name} สร้างได้ ${plan.videosPerMonth} วิดีโอ/เดือน และคุณใช้ครบแล้ว`);
      return;
    }

    if (!canUseDuration(brief.duration_min)) {
      setPaywall(th.error.planDuration(plan.maxDurationMin));
      return;
    }

    create.mutate();
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="ข้อมูลบทเรียน" subtitle="ขั้นตอนที่ 1 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={0} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="small" color={colors.textSecondary}>
          กรอกข้อมูลให้ AI เข้าใจบริบทห้องเรียนของคุณ ยิ่งชัดเจน บทวิดีโอจะยิ่งตรงกับที่ต้องการ
        </Text>

        <LessonBriefForm value={brief} onChange={setBrief} errors={errors} maxDurationMin={plan.maxDurationMin} />

        <Button label="ถัดไป: วัตถุประสงค์การเรียนรู้" iconRight="arrow-forward" loading={create.isPending} onPress={submit} />
      </ScrollView>

      <PaywallSheet
        visible={paywall !== null}
        onClose={() => setPaywall(null)}
        title="อัปเกรดเพื่อสร้างต่อ"
        reason={paywall ?? ''}
        suggestedPlan={nextPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
});
