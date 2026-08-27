import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing } from '@/theme';
import {
  Card,
  EmptyState,
  GradientHeader,
  Input,
  LoadingState,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { TemplateCard } from '@/components/domain/TemplateCard';
import { queryKeys } from '@/lib/queryClient';
import { listTemplates } from '@/lib/api/templates';
import { SUBJECTS } from '@/constants/lesson';
import { th } from '@/i18n/th';
import type { SubjectKey } from '@/types/domain';

const SUBJECT_FILTERS: { value: SubjectKey | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  ...SUBJECTS.filter((s) => s.value !== 'other').map((s) => ({
    value: s.value as SubjectKey | 'all',
    label: `${s.emoji} ${s.label}`,
  })),
];

export default function TemplatesScreen() {
  const [subject, setSubject] = useState<SubjectKey | 'all'>('all');
  const [search, setSearch] = useState('');

  const templates = useQuery({
    queryKey: queryKeys.templates(subject, search),
    queryFn: () => listTemplates({ subject, search }),
  });

  return (
    <View style={styles.flex}>
      <GradientHeader
        title={th.nav.templates}
        subtitle="เริ่มจากโครงบทเรียนที่ครูท่านอื่นใช้ได้ผล แล้วปรับให้เข้ากับห้องเรียนของคุณ"
      />

      <View style={styles.filters}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาเทมเพลต เช่น วัฏจักรน้ำ"
          icon="search-outline"
          returnKeyType="search"
        />
        <SegmentedControl segments={SUBJECT_FILTERS} value={subject} onChange={setSubject} scrollable />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {templates.isLoading ? (
          <LoadingState message="กำลังโหลดเทมเพลต…" />
        ) : (templates.data?.length ?? 0) === 0 ? (
          <Card>
            <EmptyState
              emoji="🔍"
              title={th.empty.templates}
              description="ลองเปลี่ยนคำค้นหา หรือเลือกวิชาอื่น"
            />
          </Card>
        ) : (
          templates.data?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/create',
                  params: {
                    templateId: template.id,
                    prompt: `${template.title} ${template.grade_levels[0] ?? ''} ความยาว ${template.duration_min} นาที`,
                  },
                })
              }
            />
          ))
        )}

        <Card tone="outlined" style={styles.notice}>
          <Text variant="bodyStrong">อยากขายเทมเพลตของคุณ?</Text>
          <Text variant="small" color={colors.textSecondary}>
            เรากำลังเตรียม Template Marketplace ให้ครูเผยแพร่และจำหน่ายโครงบทเรียนของตัวเองได้
            ระหว่างนี้คุณบันทึกวิดีโอที่ทำเสร็จเป็นเทมเพลตส่วนตัวไว้ใช้ซ้ำได้แล้ว
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.lg, gap: spacing.md },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing['4xl'] },
  notice: { gap: spacing.xs, marginTop: spacing.lg },
});
