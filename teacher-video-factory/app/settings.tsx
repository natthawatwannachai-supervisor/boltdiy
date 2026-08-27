import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMutation } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  Button,
  Card,
  ChipGroup,
  ConfirmDialog,
  GradientHeader,
  Input,
  Select,
  Text,
  useToast,
} from '@/components/ui';
import { CREATE_GRADE_LEVELS, EDUCATION_STAGES, SUBJECTS } from '@/constants/lesson';
import { updateProfile } from '@/lib/api/auth';
import { deleteMyAccount, exportMyData } from '@/lib/api/privacy';
import { disableNotifications, registerForPushNotifications } from '@/lib/notifications';
import { useProfile, useSessionStore } from '@/store/session';
import { errorMessage } from '@/lib/errors';
import type { EducationStage, GradeLevel, SubjectKey } from '@/types/domain';

export default function SettingsScreen() {
  const toast = useToast();
  const profile = useProfile();
  const setProfile = useSessionStore((state) => state.setProfile);

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [school, setSchool] = useState(profile?.school ?? '');
  const [affiliation, setAffiliation] = useState(profile?.affiliation ?? '');
  const [stage, setStage] = useState<EducationStage | null>(profile?.education_stage ?? null);
  const [grades, setGrades] = useState<GradeLevel[]>(profile?.grade_levels ?? []);
  const [subjects, setSubjects] = useState<SubjectKey[]>(profile?.subjects ?? []);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      updateProfile(profile!.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        position: position.trim() || null,
        school: school.trim() || null,
        affiliation: affiliation.trim() || null,
        education_stage: stage,
        grade_levels: grades,
        subjects,
      }),
    onSuccess: (updated) => {
      setProfile(updated);
      toast.success('บันทึกโปรไฟล์แล้ว');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const exportData = useMutation({
    mutationFn: exportMyData,
    onSuccess: async (data) => {
      await Clipboard.setStringAsync(JSON.stringify(data, null, 2));
      toast.success('คัดลอกข้อมูลของคุณไปยังคลิปบอร์ดแล้ว');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const removeAccount = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      setConfirmDelete(false);
      toast.success('ลบบัญชีเรียบร้อย');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const togglePush = async (next: boolean) => {
    setPushEnabled(next);

    try {
      if (next && profile) {
        await registerForPushNotifications(profile.id);
      } else {
        await disableNotifications();
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="ตั้งค่า" subtitle="โปรไฟล์ การแจ้งเตือน และความเป็นส่วนตัว" showBack />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text variant="h3">👤 ข้อมูลครู</Text>
          <Input label="ชื่อ" value={firstName} onChangeText={setFirstName} icon="person-outline" />
          <Input label="นามสกุล" value={lastName} onChangeText={setLastName} />
          <Input label="ตำแหน่ง" value={position} onChangeText={setPosition} icon="ribbon-outline" />
          <Input label="โรงเรียน" value={school} onChangeText={setSchool} icon="school-outline" />
          <Input label="สังกัด" value={affiliation} onChangeText={setAffiliation} icon="business-outline" />
          <Select label="ระดับการศึกษา" value={stage} options={EDUCATION_STAGES} onChange={setStage} />
          <ChipGroup label="ระดับชั้นที่สอน" options={CREATE_GRADE_LEVELS} value={grades} onChange={setGrades} />
          <ChipGroup label="วิชาที่สอน" options={SUBJECTS} value={subjects} onChange={setSubjects} />
          <Button label="บันทึกการเปลี่ยนแปลง" loading={save.isPending} onPress={() => save.mutate()} />
        </Card>

        <Card style={styles.section}>
          <Text variant="h3">🔔 การแจ้งเตือน</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text variant="body">แจ้งเตือนเมื่อวิดีโอสร้างเสร็จ</Text>
              <Text variant="small" color={colors.textSecondary}>
                รวมถึงการได้รับเครดิตจากการเชิญเพื่อน
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(next) => void togglePush(next)}
              trackColor={{ true: colors.primary, false: colors.borderStrong }}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text variant="h3">🔒 ความเป็นส่วนตัว (PDPA)</Text>
          <Text variant="small" color={colors.textSecondary}>
            คุณเป็นเจ้าของข้อมูลของคุณ ดาวน์โหลดหรือลบได้ทุกเมื่อ
          </Text>
          <Button
            label="ดาวน์โหลดข้อมูลของฉัน"
            variant="secondary"
            icon="cloud-download-outline"
            loading={exportData.isPending}
            onPress={() => exportData.mutate()}
          />
          <Button
            label="ข้อกำหนดและนโยบายความเป็นส่วนตัว"
            variant="ghost"
            icon="document-text-outline"
            onPress={() => router.push('/legal')}
          />
          <View style={styles.danger}>
            <View style={styles.dangerHeader}>
              <Ionicons name="warning-outline" size={18} color={colors.danger} />
              <Text variant="bodyStrong" color={colors.danger}>
                เขตอันตราย
              </Text>
            </View>
            <Text variant="small" color={colors.textSecondary}>
              การลบบัญชีจะลบโปรเจกต์ วิดีโอ ไฟล์ภาพและเสียงทั้งหมดอย่างถาวร
            </Text>
            <Button label="ลบบัญชีถาวร" variant="danger" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
          </View>
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="ลบบัญชีถาวร?"
        message="ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ รวมถึงเครดิตคงเหลือและวิดีโอที่สร้างไว้"
        confirmLabel="ลบบัญชีของฉัน"
        destructive
        loading={removeAccount.isPending}
        onConfirm={() => removeAccount.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  danger: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
