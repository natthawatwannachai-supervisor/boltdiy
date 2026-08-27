import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import { AIThinking, Badge, Button, Card, GradientHeader, Input, Text, useToast } from '@/components/ui';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { PaywallSheet } from '@/components/domain/PaywallSheet';
import { analyzeTopic, createVideoFromBrief, type AnalyzeResult } from '@/lib/api/ai';
import { estimateCreditsForVideo, estimateSceneCount } from '@/constants/billing';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { usePlan } from '@/hooks/usePlan';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { formatDuration } from '@/utils/format';
import { th } from '@/i18n/th';

const EXAMPLES = [
  'การเกิดฝน ป.5 ความยาว 5 นาที',
  'ระบบสุริยะ ป.4',
  'การสังเคราะห์แสง ป.6 ความยาว 5 นาที',
  'เศษส่วน ป.4 แบบการ์ตูน',
  'คำราชาศัพท์ ม.1 ติวสอบ',
];

/**
 * หัวใจของแอป: One Prompt → Full Video
 * ครูพิมพ์ประโยคเดียว ระบบวิเคราะห์ให้เอง แล้วเดินสายพานผลิตจนได้ไฟล์วิดีโอ
 */
export default function CreateScreen() {
  const params = useLocalSearchParams<{ templateId?: string; prompt?: string; projectId?: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const { plan, videosLeft, canUseDuration, nextPlan } = usePlan();

  const [prompt, setPrompt] = useState(params.prompt ?? '');
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [paywall, setPaywall] = useState<string | null>(null);

  const analyze = useMutation({
    mutationFn: async () => {
      const result = await guard.run('analyze', 1, () => analyzeTopic(prompt.trim()));

      if (!result) {
        throw new Error('__handled__');
      }

      return result;
    },
    onSuccess: (result) => {
      setAnalysis(result);
      track('topic_analyzed', { subject: result.brief.subject, grade: result.brief.grade_level });
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const create = useMutation({
    mutationFn: async (autoPilot: boolean) => {
      if (!analysis) {
        throw new Error('__handled__');
      }

      const sceneCount = estimateSceneCount(analysis.brief.duration_min);
      const cost = estimateCreditsForVideo(sceneCount);

      // โหมดอัตโนมัติเดินครบทุกขั้นรวดเดียว จึงต้องมีเครดิตพอทั้งงานตั้งแต่ต้น
      if (autoPilot && !guard.ensureAmount(cost, 'render')) {
        throw new Error('__handled__');
      }

      const result = await createVideoFromBrief({
        brief: analysis.brief,
        title: analysis.suggested_title,
        project_id: params.projectId ?? null,
        template_id: params.templateId ?? null,
        auto_pilot: autoPilot,
      });

      return { video: result.video, autoPilot };
    },
    onSuccess: ({ video, autoPilot }) => {
      track('create_started', { auto_pilot: autoPilot, subject: video.subject });

      if (autoPilot) {
        router.push(`/video/${video.id}`);
      } else {
        router.push(`/wizard/${video.id}/objectives`);
      }
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const startCreate = (autoPilot: boolean) => {
    if (videosLeft <= 0) {
      setPaywall(`แพ็กเกจ ${plan.name} สร้างได้ ${plan.videosPerMonth} วิดีโอ/เดือน และคุณใช้ครบแล้ว`);
      return;
    }

    if (analysis && !canUseDuration(analysis.brief.duration_min)) {
      setPaywall(th.error.planDuration(plan.maxDurationMin));
      return;
    }

    create.mutate(autoPilot);
  };

  const sceneCount = analysis ? estimateSceneCount(analysis.brief.duration_min) : 0;
  const estimatedCredits = analysis ? estimateCreditsForVideo(sceneCount) : 0;

  return (
    <View style={styles.flex}>
      <GradientHeader title="สร้างวิดีโอด้วย AI" subtitle={th.tagline} tone="ai" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card style={styles.promptCard}>
            <Text variant="h2">วันนี้คุณอยากสอนเรื่องอะไร?</Text>
            <Input
              value={prompt}
              onChangeText={(text) => {
                setPrompt(text);
                setAnalysis(null);
              }}
              placeholder='พิมพ์หัวข้อ เช่น "ระบบสุริยะ ป.4"'
              multiline
              maxLength={200}
            />

            <View style={styles.examples}>
              <Text variant="caption" color={colors.textMuted}>
                ตัวอย่าง
              </Text>
              <View style={styles.exampleChips}>
                {EXAMPLES.map((example) => (
                  <Pressable
                    key={example}
                    onPress={() => {
                      setPrompt(example);
                      setAnalysis(null);
                    }}
                    style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                  >
                    <Text variant="caption" color={colors.primary}>
                      {example}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {!analysis ? (
              <Button
                label="✨ สร้างวิดีโอให้ฉัน"
                size="lg"
                variant="ai"
                loading={analyze.isPending}
                disabled={prompt.trim().length < 3}
                onPress={() => analyze.mutate()}
              />
            ) : null}
          </Card>

          {!analysis && !analyze.isPending ? (
            <Button
              label="หรือกรอกรายละเอียดเองทีละขั้น"
              variant="ghost"
              icon="list-outline"
              onPress={() => router.push('/wizard/new')}
            />
          ) : null}

          {analyze.isPending ? (
            <AIThinking message="🤖 AI กำลังวิเคราะห์หัวข้อของคุณ…" hint="กำลังระบุวิชา ระดับชั้น และความยาวที่เหมาะสม" />
          ) : null}

          {analysis ? (
            <>
              <Card style={styles.detectedCard}>
                <View style={styles.detectedHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text variant="h3">พบข้อมูล</Text>
                </View>
                <Text variant="bodyStrong">{analysis.suggested_title}</Text>
                <View style={styles.detectedRows}>
                  {analysis.detected.map((item) => (
                    <View key={item.field} style={styles.detectedRow}>
                      <Text variant="small" color={colors.textSecondary}>
                        {item.label}
                      </Text>
                      <Badge label={item.value} tone="primary" />
                    </View>
                  ))}
                </View>
                <Text variant="caption" color={colors.textMuted}>
                  ประมาณ {sceneCount} ฉาก · ใช้ราว {estimatedCredits} เครดิต · {formatDuration(analysis.brief.duration_min)}
                </Text>
              </Card>

              <View style={styles.actions}>
                <Button
                  label="🚀 ให้ AI ทำให้ครบทุกขั้น"
                  size="lg"
                  variant="ai"
                  loading={create.isPending}
                  onPress={() => startCreate(true)}
                />
                <Button
                  label="ปรับแต่งเองทีละขั้น"
                  variant="secondary"
                  icon="options-outline"
                  disabled={create.isPending}
                  onPress={() => startCreate(false)}
                />
                <Button
                  label="แก้หัวข้อ"
                  variant="ghost"
                  onPress={() => setAnalysis(null)}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <InsufficientCreditsSheet
        visible={guard.visible}
        required={guard.required}
        balance={guard.balance}
        action={guard.action}
        onClose={guard.dismiss}
      />

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
  promptCard: { gap: spacing.lg },
  examples: { gap: spacing.sm },
  exampleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  pressed: { opacity: 0.75 },
  detectedCard: { gap: spacing.md, borderWidth: 1, borderColor: colors.success },
  detectedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detectedRows: { gap: spacing.sm },
  detectedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { gap: spacing.md },
});
