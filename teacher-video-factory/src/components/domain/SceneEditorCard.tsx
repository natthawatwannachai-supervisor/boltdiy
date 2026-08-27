import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Badge, Button, Card, IconButton, Input, Text } from '@/components/ui';
import { formatSceneRange } from '@/utils/format';
import type { Scene } from '@/types/domain';

interface SceneEditorCardProps {
  scene: Scene;
  busy?: boolean;
  onSave: (patch: Partial<Scene>) => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
}

/** การ์ดแก้ไขฉากในขั้นตอน "AI Script" — ครูตรวจและปรับได้ทุกช่อง */
export function SceneEditorCard({
  scene,
  busy = false,
  onSave,
  onRegenerate,
  onDelete,
  onAddAfter,
}: SceneEditorCardProps) {
  const [editing, setEditing] = useState(false);
  const [visual, setVisual] = useState(scene.visual_description);
  const [narration, setNarration] = useState(scene.narration);
  const [onScreen, setOnScreen] = useState(scene.on_screen_text ?? '');

  const save = () => {
    onSave({
      visual_description: visual.trim(),
      narration: narration.trim(),
      on_screen_text: onScreen.trim() || null,
    });
    setEditing(false);
  };

  const cancel = () => {
    setVisual(scene.visual_description);
    setNarration(scene.narration);
    setOnScreen(scene.on_screen_text ?? '');
    setEditing(false);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Badge label={`Scene ${String(scene.index + 1).padStart(2, '0')}`} tone="primary" />
          <Text variant="caption" color={colors.textMuted}>
            เวลา {formatSceneRange(scene.start_sec, scene.end_sec)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="sparkles" label="สร้างฉากนี้ใหม่" onPress={onRegenerate} disabled={busy} color={colors.accent} />
          <IconButton icon="trash-outline" label="ลบฉากนี้" onPress={onDelete} disabled={busy} color={colors.danger} />
        </View>
      </View>

      {scene.image_url ? (
        <Image source={{ uri: scene.image_url }} style={styles.preview} contentFit="cover" transition={200} />
      ) : null}

      {editing ? (
        <View style={styles.form}>
          <Input label="ภาพ" value={visual} onChangeText={setVisual} multiline />
          <Input label="เสียงบรรยาย" value={narration} onChangeText={setNarration} multiline />
          <Input label="ข้อความบนหน้าจอ" value={onScreen} onChangeText={setOnScreen} />
          <View style={styles.formActions}>
            <Button label="บันทึก" icon="checkmark" onPress={save} />
            <Button label="ยกเลิก" variant="ghost" onPress={cancel} />
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <Field icon="image-outline" label="ภาพ" value={scene.visual_description} />
          <Field icon="mic-outline" label="เสียงบรรยาย" value={scene.narration} />
          {scene.on_screen_text ? (
            <Field icon="text-outline" label="ข้อความบนหน้าจอ" value={scene.on_screen_text} />
          ) : null}
          {scene.transition ? (
            <Text variant="caption" color={colors.textMuted}>
              เปลี่ยนฉาก: {scene.transition}
            </Text>
          ) : null}
        </View>
      )}

      <View style={styles.footer}>
        {!editing ? (
          <Button label="แก้ไข" icon="create-outline" variant="secondary" size="sm" fullWidth={false} onPress={() => setEditing(true)} />
        ) : null}
        <Button label="เพิ่ม Scene ถัดไป" icon="add" variant="ghost" size="sm" fullWidth={false} onPress={onAddAfter} />
      </View>
    </Card>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabel}>
        <Ionicons name={icon} size={14} color={colors.textMuted} />
        <Text variant="caption" color={colors.textMuted}>
          {label}
        </Text>
      </View>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  preview: { height: 150, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  body: { gap: spacing.md },
  field: { gap: 2 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  form: { gap: spacing.md },
  formActions: { gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
