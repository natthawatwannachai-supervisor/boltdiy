import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { useMutation } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  GradientHeader,
  LoadingState,
  Select,
  Text,
  useToast,
} from '@/components/ui';
import { PaywallSheet } from '@/components/domain/PaywallSheet';
import { exportVideo } from '@/lib/api/ai';
import { useVideo } from '@/hooks/useVideo';
import { usePlan } from '@/hooks/usePlan';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import { ASPECT_RATIOS, RESOLUTIONS } from '@/constants/media';
import type { AspectRatio, Resolution } from '@/types/domain';

interface ShareTarget {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  url: (link: string) => string;
}

const SHARE_TARGETS: ShareTarget[] = [
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000', url: () => 'https://studio.youtube.com/channel/upload' },
  { key: 'classroom', label: 'Google Classroom', icon: 'school-outline', color: '#0F9D58', url: (link) => `https://classroom.google.com/share?url=${encodeURIComponent(link)}` },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', url: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { key: 'line', label: 'LINE', icon: 'chatbubble-ellipses-outline', color: '#06C755', url: (link) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}` },
  { key: 'tiktok', label: 'TikTok', icon: 'musical-notes-outline', color: '#010101', url: () => 'https://www.tiktok.com/upload' },
];

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { plan, canUseResolution, canRemoveWatermark, nextPlan } = usePlan();
  const video = useVideo(id, { realtime: false });

  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<string | null>(null);

  const runExport = useMutation({
    mutationFn: () => exportVideo({ video_id: id, aspect_ratio: aspect, resolution }),
    onSuccess: (result) => {
      setDownloadUrl(result.download_url);
      track('video_exported', { video_id: id, aspect, resolution, status: result.status });

      toast.success(
        result.status === 'ready'
          ? 'ส่งออกวิดีโอเรียบร้อย'
          : 'กำลังสร้างไฟล์ในรูปแบบใหม่ให้คุณ เราจะแจ้งเตือนเมื่อพร้อมดาวน์โหลด',
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const download = useMutation({
    mutationFn: async () => {
      const url = downloadUrl ?? video.data?.video_url;

      if (!url) {
        throw new Error('ยังไม่มีไฟล์ให้ดาวน์โหลด');
      }

      const destination = new Directory(Paths.cache, 'exports');

      if (!destination.exists) {
        destination.create({ intermediates: true });
      }

      const file = await File.downloadFileAsync(url, destination);
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(file.uri);
        return 'library' as const;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
        return 'shared' as const;
      }

      return 'cached' as const;
    },
    onSuccess: (result) => {
      toast.success(
        result === 'library'
          ? 'บันทึกวิดีโอลงคลังภาพของคุณแล้ว'
          : result === 'shared'
            ? 'เปิดเมนูแชร์ไฟล์แล้ว'
            : 'ดาวน์โหลดไฟล์เรียบร้อย',
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (video.isLoading) {
    return <LoadingState message="กำลังเตรียมการส่งออก…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const link = downloadUrl ?? video.data.video_url ?? '';

  const chooseResolution = (next: Resolution) => {
    if (!canUseResolution(next)) {
      setPaywall(`ความละเอียด ${next} ใช้ได้ในแพ็กเกจ TEACHER ขึ้นไป`);
      return;
    }

    setResolution(next);
  };

  const openTarget = async (target: ShareTarget) => {
    if (!link) {
      toast.error('กรุณาส่งออกวิดีโอก่อนแชร์');
      return;
    }

    track('video_shared', { video_id: id, target: target.key });
    await Linking.openURL(target.url(link));
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="ส่งออกและแชร์" subtitle={video.data.title} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text variant="h3">📐 สัดส่วนภาพ</Text>
          <Select
            label="Aspect Ratio"
            value={aspect}
            options={ASPECT_RATIOS}
            onChange={setAspect}
            sheetTitle="เลือกสัดส่วนภาพ"
          />
          <Text variant="h3">🎞️ ความละเอียด</Text>
          <Select
            label="Resolution"
            value={resolution}
            options={RESOLUTIONS}
            onChange={chooseResolution}
            sheetTitle="เลือกความละเอียด"
          />
          {!canRemoveWatermark ? (
            <Badge label={`แพ็กเกจ ${plan.name} จะมีลายน้ำบนวิดีโอ`} tone="warning" icon="water-outline" />
          ) : null}
          <Button
            label="ส่งออกเป็น MP4"
            icon="download-outline"
            loading={runExport.isPending}
            onPress={() => runExport.mutate()}
          />
        </Card>

        {link ? (
          <Card style={styles.section}>
            <Text variant="h3">พร้อมนำไปใช้แล้ว</Text>
            <Button label="ดาวน์โหลดลงเครื่อง" icon="save-outline" loading={download.isPending} onPress={() => download.mutate()} />
            <Button
              label="แชร์ไฟล์"
              icon="share-outline"
              variant="secondary"
              onPress={async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(link);
                } else {
                  toast.error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
                }
              }}
            />
            <Button
              label="คัดลอกลิงก์"
              icon="link-outline"
              variant="ghost"
              onPress={async () => {
                await Clipboard.setStringAsync(link);
                toast.success('คัดลอกลิงก์แล้ว');
              }}
            />
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text variant="h3">แชร์ไปยัง</Text>
          <View style={styles.targets}>
            {SHARE_TARGETS.map((target) => (
              <Pressable
                key={target.key}
                onPress={() => void openTarget(target)}
                style={({ pressed }) => [styles.target, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`แชร์ไปยัง ${target.label}`}
              >
                <View style={[styles.targetIcon, { backgroundColor: `${target.color}1A` }]}>
                  <Ionicons name={target.icon} size={22} color={target.color} />
                </View>
                <Text variant="caption" center numberOfLines={2}>
                  {target.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>

      <PaywallSheet
        visible={paywall !== null}
        onClose={() => setPaywall(null)}
        title="อัปเกรดเพื่อคุณภาพที่สูงขึ้น"
        reason={paywall ?? ''}
        suggestedPlan={nextPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  section: { gap: spacing.md },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  target: { width: '18%', alignItems: 'center', gap: spacing.xs },
  targetIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
