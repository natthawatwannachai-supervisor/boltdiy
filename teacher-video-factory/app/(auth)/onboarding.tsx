import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Button, ChipGroup, Input, Screen, Select, Stepper, Text, useToast } from '@/components/ui';
import {
  CREATE_GRADE_LEVELS,
  EDUCATION_STAGES,
  GRADE_LEVELS,
  SUBJECTS,
} from '@/constants/lesson';
import { completeOnboarding } from '@/lib/api/auth';
import { useSessionStore } from '@/store/session';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import type { EducationStage, GradeLevel, SubjectKey } from '@/types/domain';

const STEPS = [
  { key: 'name', label: 'ข้อมูลส่วนตัว' },
  { key: 'school', label: 'สถานศึกษา' },
  { key: 'teaching', label: 'การสอน' },
];

/** เก็บข้อมูลครูเพื่อให้ AI ปรับภาษาและระดับเนื้อหาให้เหมาะกับผู้เรียนตั้งแต่วิดีโอแรก */
export default function OnboardingScreen() {
  const toast = useToast();
  const session = useSessionStore((state) => state.session);
  const setProfile = useSessionStore((state) => state.setProfile);

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [school, setSchool] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [stage, setStage] = useState<EducationStage | null>(null);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<SubjectKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = () => {
    if (step === 0 && !firstName.trim()) {
      setError('กรุณากรอกชื่อของคุณ');
      return;
    }

    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const submit = async () => {
    if (subjects.length === 0) {
      setError('เลือกอย่างน้อย 1 วิชาที่สอน');
      return;
    }

    if (!session) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const profile = await completeOnboarding(session.user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        position: position.trim() || null,
        school: school.trim() || null,
        affiliation: affiliation.trim() || null,
        education_stage: stage,
        grade_levels: grades,
        subjects,
      });

      setProfile(profile);
      track('onboarding_completed', { subjects: subjects.length, stage });
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1">ตั้งค่าโปรไฟล์ครู</Text>
          <Text variant="small" color={colors.textSecondary}>
            ใช้เวลาไม่ถึง 1 นาที เพื่อให้ AI สร้างสื่อได้ตรงกับห้องเรียนของคุณ
          </Text>
        </View>

        <Stepper steps={STEPS} current={step} />

        {step === 0 ? (
          <View style={styles.form}>
            <Input label="ชื่อ" required value={firstName} onChangeText={setFirstName} placeholder="สมชาย" icon="person-outline" />
            <Input label="นามสกุล" value={lastName} onChangeText={setLastName} placeholder="ใจดี" />
            <Input
              label="ตำแหน่ง"
              value={position}
              onChangeText={setPosition}
              placeholder="ครูชำนาญการ / ศึกษานิเทศก์"
              icon="ribbon-outline"
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.form}>
            <Input label="โรงเรียน / สถานศึกษา" value={school} onChangeText={setSchool} placeholder="โรงเรียนบ้านหนองบัว" icon="school-outline" />
            <Input label="สังกัด" value={affiliation} onChangeText={setAffiliation} placeholder="สพป. / สพม. / กศน. / อปท." icon="business-outline" />
            <Select
              label="ระดับการศึกษา"
              value={stage}
              options={EDUCATION_STAGES}
              onChange={setStage}
              placeholder="เลือกระดับการศึกษา"
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.form}>
            <ChipGroup
              label="ระดับชั้นที่สอน"
              options={stage === 'kindergarten' ? GRADE_LEVELS.slice(0, 3) : CREATE_GRADE_LEVELS}
              value={grades}
              onChange={setGrades}
            />
            <ChipGroup label="วิชาที่สอน" options={SUBJECTS} value={subjects} onChange={setSubjects} />
          </View>
        ) : null}

        {error ? (
          <Text variant="small" color={colors.danger}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {step < STEPS.length - 1 ? (
            <Button label="ถัดไป" iconRight="arrow-forward" onPress={next} />
          ) : (
            <Button label="เริ่มใช้งาน" icon="sparkles" loading={loading} onPress={() => void submit()} />
          )}
          {step > 0 ? <Button label="ย้อนกลับ" variant="ghost" onPress={() => setStep((s) => s - 1)} /> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.xl, paddingTop: spacing.xl },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  actions: { gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.xl },
});
