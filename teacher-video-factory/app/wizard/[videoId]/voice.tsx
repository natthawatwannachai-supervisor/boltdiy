import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  GradientHeader,
  LoadingState,
  SegmentedControl,
  Select,
  Slider,
  Stepper,
  Text,
  useToast,
} from '@/components/ui';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { PaywallSheet } from '@/components/domain/PaywallSheet';
import { WIZARD_STEPS } from '@/constants/wizard';
import { previewVoice } from '@/lib/api/ai';
import { updateVideo } from '@/lib/api/videos';
import { useScenes, useVideo } from '@/hooks/useVideo';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { usePlan } from '@/hooks/usePlan';
import { queryKeys } from '@/lib/queryClient';
import { errorMessage } from '@/lib/errors';
import {
  MUSIC_TRACKS,
  SUBTITLE_FONTS,
  SUBTITLE_SIZES,
  SUBTITLE_STYLES,
  VOICES,
  VOICE_LANGUAGES,
} from '@/constants/media';
import type { SubtitleStyle, VoiceGender } from '@/types/domain';

const PREVIEW_TEXT = 'เคยสงสัยไหมครับว่า ฝนที่ตกลงมาจากท้องฟ้าเกิดขึ้นได้อย่างไร';

/** ขั้นตอนที่ 5: เลือกเสียงบรรยาย ปรับพารามิเตอร์ ตั้งค่า Subtitle และเพลงประกอบ */
export default function VoiceStep() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const toast = useToast();
  const guard = useCreditGuard();
  const queryClient = useQueryClient();
  const { canUsePremiumVoice, nextPlan } = usePlan();
  const video = useVideo(videoId, { realtime: false });
  const scenes = useScenes(videoId, { realtime: false });
  const player = useAudioPlayer();

  const [gender, setGender] = useState<VoiceGender>('female');
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(1);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('bottom');
  const [subtitleFont, setSubtitleFont] = useState('Sarabun');
  const [subtitleSize, setSubtitleSize] = useState('32');
  const [musicId, setMusicId] = useState('none');
  const [paywall, setPaywall] = useState<string | null>(null);

  useEffect(() => {
    const data = video.data;

    if (!data) {
      return;
    }

    setVoiceId((current) => current ?? data.voice_id ?? 'th-female-teacher');
    setSpeed(data.voice_speed ?? 1);
    setPitch(data.voice_pitch ?? 0);
    setVolume(data.voice_volume ?? 1);
    setSubtitleStyle(data.subtitle_style ?? 'bottom');
    setSubtitleFont(data.subtitle_font ?? 'Sarabun');
    setSubtitleSize(String(data.subtitle_size ?? 32));
    setMusicId(data.music_id ?? 'none');
    setLanguage(data.subtitle_language ?? 'th');
  }, [video.data]);

  const visibleVoices = useMemo(() => VOICES.filter((voice) => voice.gender === gender), [gender]);

  const preview = useMutation({
    mutationFn: async (id: string) => {
      const result = await guard.run('voice', 1, () =>
        previewVoice({ voice_id: id, text: PREVIEW_TEXT, speed, pitch, language }),
      );

      if (!result) {
        throw new Error('__handled__');
      }

      return result.audio_url;
    },
    onSuccess: (url) => {
      player.replace({ uri: url });
      player.play();
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const save = useMutation({
    mutationFn: () =>
      updateVideo(videoId, {
        voice_id: voiceId,
        voice_speed: speed,
        voice_pitch: pitch,
        voice_volume: volume,
        subtitle_enabled: true,
        subtitle_style: subtitleStyle,
        subtitle_font: subtitleFont,
        subtitle_size: Number(subtitleSize),
        subtitle_language: language,
        music_id: musicId === 'none' ? null : musicId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.video(videoId) });
      router.push(`/wizard/${videoId}/render`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (video.isLoading) {
    return <LoadingState message="กำลังโหลดการตั้งค่าเสียง…" />;
  }

  if (video.isError || !video.data) {
    return <ErrorState message={errorMessage(video.error)} onRetry={() => void video.refetch()} />;
  }

  const selectVoice = (id: string, premium: boolean) => {
    if (premium && !canUsePremiumVoice) {
      setPaywall('เสียง AI Premium ใช้ได้ในแพ็กเกจ PRO TEACHER ขึ้นไป');
      return;
    }

    setVoiceId(id);
  };

  return (
    <View style={styles.flex}>
      <GradientHeader title="เสียงบรรยาย & Subtitle" subtitle="ขั้นตอนที่ 5 จาก 6" showBack tone="ai">
        <Stepper steps={WIZARD_STEPS} current={4} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text variant="h3">🎙️ เสียงบรรยาย</Text>
          <SegmentedControl
            segments={[
              { value: 'female', label: 'เสียงผู้หญิง' },
              { value: 'male', label: 'เสียงผู้ชาย' },
            ]}
            value={gender}
            onChange={setGender}
          />

          <View style={styles.voiceList}>
            {visibleVoices.map((voice) => {
              const active = voice.id === voiceId;

              return (
                <Pressable
                  key={voice.id}
                  onPress={() => selectVoice(voice.id, voice.premium)}
                  style={({ pressed }) => [styles.voiceRow, active && styles.voiceRowActive, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.primary : colors.textMuted}
                  />
                  <View style={styles.voiceText}>
                    <View style={styles.voiceTitle}>
                      <Text variant="bodyStrong">{voice.label}</Text>
                      {voice.premium ? <Badge label="Premium" tone="ai" /> : null}
                    </View>
                    <Text variant="small" color={colors.textSecondary}>
                      {voice.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => preview.mutate(voice.id)}
                    hitSlop={10}
                    accessibilityLabel={`ฟังตัวอย่างเสียง ${voice.label}`}
                    style={styles.playButton}
                  >
                    <Ionicons
                      name={preview.isPending && preview.variables === voice.id ? 'hourglass-outline' : 'play'}
                      size={16}
                      color={colors.primary}
                    />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>

          <Select label="ภาษาเสียงบรรยาย" value={language} options={VOICE_LANGUAGES} onChange={setLanguage} />

          <View style={styles.sliders}>
            <Slider label="ความเร็ว" value={speed} min={0.5} max={1.5} step={0.05} onChange={setSpeed} formatValue={(v) => `${v.toFixed(2)}x`} />
            <Slider label="Pitch" value={pitch} min={-5} max={5} step={0.5} onChange={setPitch} formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`} />
            <Slider label="ความดัง" value={volume} min={0.3} max={1.5} step={0.05} onChange={setVolume} formatValue={(v) => `${Math.round(v * 100)}%`} />
          </View>

          <Button
            label="ฟังตัวอย่างเสียงที่เลือก"
            variant="secondary"
            icon="volume-high-outline"
            loading={preview.isPending}
            disabled={!voiceId}
            onPress={() => voiceId && preview.mutate(voiceId)}
          />
        </Card>

        <Card style={styles.section}>
          <Text variant="h3">💬 Subtitle</Text>
          <Text variant="small" color={colors.textSecondary}>
            ระบบสร้าง Subtitle อัตโนมัติจากบทวิดีโอ พร้อมจับเวลาให้ตรงกับเสียงบรรยาย
          </Text>
          <Select
            label="รูปแบบ"
            value={subtitleStyle}
            options={SUBTITLE_STYLES}
            onChange={setSubtitleStyle}
          />
          <Select label="ฟอนต์" value={subtitleFont} options={SUBTITLE_FONTS} onChange={setSubtitleFont} />
          <Select label="ขนาดตัวอักษร" value={subtitleSize} options={SUBTITLE_SIZES} onChange={setSubtitleSize} />
        </Card>

        <Card style={styles.section}>
          <Text variant="h3">🎵 เพลงประกอบ</Text>
          <Text variant="small" color={colors.textSecondary}>
            ใช้เฉพาะเพลงที่มีสิทธิ์ใช้งานเชิงพาณิชย์ ตรวจสอบลิขสิทธิ์แล้วทุกแทร็ก
          </Text>
          <View style={styles.musicGrid}>
            {MUSIC_TRACKS.map((track) => {
              const active = track.id === musicId;

              return (
                <Pressable
                  key={track.id}
                  onPress={() => setMusicId(track.id)}
                  style={({ pressed }) => [styles.musicChip, active && styles.musicChipActive, pressed && styles.pressed]}
                >
                  <Text variant="small" color={active ? colors.primary : colors.textSecondary}>
                    {track.emoji} {track.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {musicId !== 'none' ? (
            <Text variant="caption" color={colors.textMuted}>
              สิทธิ์การใช้งาน: {MUSIC_TRACKS.find((t) => t.id === musicId)?.license}
            </Text>
          ) : null}
        </Card>

        <Button
          label={`ถัดไป: ประกอบวิดีโอ (${scenes.data?.length ?? 0} ฉาก)`}
          iconRight="arrow-forward"
          loading={save.isPending}
          disabled={!voiceId}
          onPress={() => save.mutate()}
        />
      </ScrollView>

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
        title="ปลดล็อกเสียง Premium"
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
  voiceList: { gap: spacing.sm },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  voiceRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  voiceText: { flex: 1, gap: 2 },
  voiceTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliders: { gap: spacing.xs },
  musicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  musicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  musicChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
});
