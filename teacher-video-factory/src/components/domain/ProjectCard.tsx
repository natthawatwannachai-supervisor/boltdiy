import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Card, Text } from '@/components/ui';
import { gradeLabel, subjectLabel } from '@/constants/lesson';
import type { Project } from '@/types/domain';

export function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const meta = [
    project.subject ? subjectLabel[project.subject] : null,
    project.grade_level ? gradeLabel[project.grade_level] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: `${project.color}1A` }]}>
          <Ionicons name="folder" size={22} color={project.color} />
        </View>
        <View style={styles.info}>
          <Text variant="h3" numberOfLines={1}>
            {project.name}
          </Text>
          <Text variant="small" color={colors.textSecondary} numberOfLines={1}>
            {meta || 'ยังไม่ระบุวิชา'} · {project.video_count ?? 0} วิดีโอ
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
});
