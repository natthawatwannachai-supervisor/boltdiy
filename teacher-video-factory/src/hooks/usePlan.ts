import { useMemo } from 'react';
import { PLANS, planByKey, type Plan } from '@/constants/billing';
import { useSubscription, useWallet } from '@/store/session';
import type { Resolution } from '@/types/domain';

export interface PlanState {
  plan: Plan;
  isPaid: boolean;
  videosLeft: number;
  creditBalance: number;
  canUseDuration: (minutes: number) => boolean;
  canUseResolution: (resolution: Resolution) => boolean;
  /** ฟีเจอร์ที่ต้องเป็นแพ็กเกจ Pro ขึ้นไป */
  canUseLessonKit: boolean;
  canUsePremiumVoice: boolean;
  canRemoveWatermark: boolean;
  nextPlan: Plan | null;
}

export const usePlan = (): PlanState => {
  const subscription = useSubscription();
  const wallet = useWallet();

  return useMemo(() => {
    const plan = planByKey(subscription?.plan ?? 'free');
    const used = subscription?.videos_used_this_period ?? 0;
    const index = PLANS.findIndex((p) => p.key === plan.key);

    return {
      plan,
      isPaid: plan.key !== 'free',
      videosLeft: Math.max(0, plan.videosPerMonth - used),
      creditBalance: wallet?.balance ?? 0,
      canUseDuration: (minutes: number) => minutes <= plan.maxDurationMin,
      canUseResolution: (resolution: Resolution) =>
        resolution === '720p' || plan.maxResolution === '1080p',
      canUseLessonKit: plan.key === 'pro_teacher' || plan.key === 'school',
      canUsePremiumVoice: plan.key === 'pro_teacher' || plan.key === 'school',
      canRemoveWatermark: !plan.watermark,
      nextPlan: index >= 0 && index < PLANS.length - 1 ? PLANS[index + 1] : null,
    };
  }, [subscription, wallet]);
};
