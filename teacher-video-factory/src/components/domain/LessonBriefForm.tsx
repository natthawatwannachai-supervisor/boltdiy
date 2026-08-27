import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Input, OptionGrid, Select, Text } from '@/components/ui';
import {
  CREATE_GRADE_LEVELS,
  DURATION_OPTIONS,
  SUBJECTS,
  VIDEO_FORMATS,
  VISUAL_STYLES,
} from '@/constants/lesson';
import type { LessonBrief } from '@/types/domain';

export interface BriefFormErrors {
  topic?: string;
  grade_level?: string;
  subject?: string;
}

/** ฟอร์ม "ข้อมูลบทเรียน" (ขั้นตอนที่ 1) ใช้ร่วมกันระหว่างการสร้างใหม่และการแก้ไขแบบร่าง */
export function LessonBriefForm({
  value,
  onChange,
  errors,
  maxDurationMin,
}: {
  value: LessonBrief;
  onChange: (next: LessonBrief) => void;
  errors?: BriefFormErrors;
  maxDurationMin: number;
}) {
  const set = <K extends keyof LessonBrief>(key: K, next: LessonBrief[K]) =>
    onChange({ ...value, [key]: next });

  const durationOptions = DURATION_OPTIONS.map((option) => ({
    ...option,
    hint: Number(option.value) > maxDurationMin ? 'ต้องอัปเกรดแพ็กเกจ' : option.hint,
  }));

  return (
    <View style={styles.form}>
      <Input
        label="หัวข้อบทเรียน"
        required
        value={value.topic}
        onChangeText={(text) => set('topic', text)}
        placeholder="เช่น การเกิดฝน"
        icon="bulb-outline"
        error={errors?.topic}
      />

      <Select
        label="ระดับชั้น"
        required
        value={value.grade_level}
        options={CREATE_GRADE_LEVELS}
        onChange={(next) => set('grade_level', next)}
        placeholder="เลือกระดับชั้น"
        error={errors?.grade_level}
      />

      <Select
        label="วิชา"
        required
        value={value.subject}
        options={SUBJECTS}
        onChange={(next) => set('subject', next)}
        placeholder="เลือกวิชา"
        error={errors?.subject}
      />

      <Select
        label="ระยะเวลาวิดีโอ"
        value={String(value.duration_min)}
        options={durationOptions}
        onChange={(next) => set('duration_min', Number(next))}
        sheetTitle="เลือกความยาววิดีโอ"
      />
      {value.duration_min > maxDurationMin ? (
        <Text variant="small" color={colors.warning}>
          แพ็กเกจปัจจุบันสร้างได้สูงสุด {maxDurationMin} นาที — เลือกความยาวนี้ได้เมื่ออัปเกรด
        </Text>
      ) : null}

      <OptionGrid
        label="รูปแบบวิดีโอ"
        options={VIDEO_FORMATS}
        value={value.format}
        onChange={(next) => set('format', next)}
      />

      <OptionGrid
        label="สไตล์ภาพ"
        options={VISUAL_STYLES}
        value={value.style}
        onChange={(next) => set('style', next)}
        columns={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
