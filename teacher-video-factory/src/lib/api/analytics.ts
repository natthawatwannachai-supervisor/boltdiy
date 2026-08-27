import { supabase } from '@/lib/supabase';

/**
 * เก็บ event สำหรับวัด KPI ของ MVP:
 * Activation, Time to First Video, Conversion, Retention
 * เขียนแบบ fire-and-forget เพื่อไม่ให้บล็อก UI
 */
export type AnalyticsEvent =
  | 'signup_completed'
  | 'onboarding_completed'
  | 'create_started'
  | 'topic_analyzed'
  | 'script_generated'
  | 'storyboard_generated'
  | 'video_render_started'
  | 'first_video_completed'
  | 'video_completed'
  | 'video_exported'
  | 'video_shared'
  | 'template_used'
  | 'assistant_used'
  | 'lesson_kit_generated'
  | 'paywall_viewed'
  | 'checkout_started'
  | 'subscription_activated'
  | 'credits_purchased'
  | 'referral_shared';

export const track = (event: AnalyticsEvent, properties: Record<string, unknown> = {}) => {
  void supabase
    .from('analytics_events')
    .insert({ event, properties, user_id: null })
    .then(({ error }) => {
      if (error && __DEV__) {
        console.warn('[analytics] บันทึก event ไม่สำเร็จ', event, error.message);
      }
    });
};
