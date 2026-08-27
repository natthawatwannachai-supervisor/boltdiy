import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  AIThinking,
  Button,
  Card,
  EmptyState,
  GradientHeader,
  IconButton,
  Text,
  useToast,
} from '@/components/ui';
import { generateLessonKit } from '@/lib/api/ai';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import type { LessonKitRow } from '@/types/database';

const SECTIONS: { key: keyof LessonKitRow; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lesson_plan', label: 'แผนการจัดการเรียนรู้', icon: 'clipboard-outline' },
  { key: 'slides_outline', label: 'โครง PowerPoint', icon: 'easel-outline' },
  { key: 'worksheet', label: 'ใบงาน', icon: 'document-text-outline' },
  { key: 'quiz', label: 'แบบทดสอบ', icon: 'help-circle-outline' },
  { key: 'handout', label: 'ใบความรู้', icon: 'book-outline' },
];

/** ฟีเจอร์พรีเมียม §24: จากวิดีโอ 1 เรื่อง สร้างสื่อประกอบการสอนครบชุด */
export default function LessonKitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();

  const kit = useQuery({
    queryKey: ['lesson-kit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_kits')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data ?? null) as LessonKitRow | null;
    },
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 5000 : false),
  });

  const generate = useMutation({
    mutationFn: () => generateLessonKit(id),
    onSuccess: async () => {
      track('lesson_kit_generated', { video_id: id });
      toast.success('เริ่มสร้างชุดสื่อการสอนแล้ว');
      await kit.refetch();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  useEffect(() => {
    if (kit.data?.status === 'ready') {
      toast.success('ชุดสื่อการสอนพร้อมใช้งานแล้ว');
    }
    // แจ้งครั้งเดียวเมื่อสถานะเปลี่ยนเป็นพร้อมใช้งาน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit.data?.status]);

  const generating = generate.isPending || kit.data?.status === 'generating';

  return (
    <View style={styles.flex}>
      <GradientHeader
        title="🚀 ชุดสื่อการสอนครบชุด"
        subtitle="แผนการสอน สไลด์ ใบงาน แบบทดสอบ และใบความรู้ จากวิดีโอเดียวกัน"
        showBack
        tone="premium"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {generating ? (
          <AIThinking
            message="🤖 AI กำลังผลิตสื่อประกอบให้ครบชุด…"
            hint="ใช้เวลาประมาณ 1–2 นาที ปิดแอปได้ ระบบจะแจ้งเตือนเมื่อเสร็จ"
          />
        ) : kit.data?.status === 'ready' ? (
          <>
            {SECTIONS.map((section) => {
              const content = kit.data?.[section.key] as string | null;

              if (!content) {
                return null;
              }

              return (
                <Card key={section.key} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitle}>
                      <Ionicons name={section.icon} size={20} color={colors.accent} />
                      <Text variant="h3">{section.label}</Text>
                    </View>
                    <IconButton
                      icon="copy-outline"
                      label={`คัดลอก${section.label}`}
                      onPress={async () => {
                        await Clipboard.setStringAsync(content);
                        toast.success(`คัดลอก${section.label}แล้ว`);
                      }}
                    />
                  </View>
                  <Text variant="small" color={colors.textSecondary}>
                    {content}
                  </Text>
                </Card>
              );
            })}

            <Button label="สร้างใหม่อีกครั้ง" variant="secondary" icon="refresh" onPress={() => generate.mutate()} />
          </>
        ) : (
          <Card>
            <EmptyState
              emoji="🚀"
              title="สร้างชุดสื่อการสอนครบชุด"
              description="AI จะใช้บทวิดีโอและวัตถุประสงค์การเรียนรู้ของคุณ สร้างแผนการสอน โครงสไลด์ ใบงาน แบบทดสอบ และใบความรู้ ให้ในคราวเดียว"
              actionLabel="เริ่มสร้าง"
              onAction={() => generate.mutate()}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md, borderRadius: radius.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
