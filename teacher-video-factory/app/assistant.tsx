import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';
import { AIThinking, Card, GradientHeader, IconButton, Input, Text, useToast } from '@/components/ui';
import { InsufficientCreditsSheet } from '@/components/domain/InsufficientCreditsSheet';
import { ASSISTANT_QUICK_PROMPTS, sendAssistantMessage } from '@/lib/api/assistant';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { errorMessage } from '@/lib/errors';
import { track } from '@/lib/api/analytics';
import type { AssistantMessageRow } from '@/types/database';

/** น้อง Teacher AI — ผู้ช่วยในแอปที่ช่วยปรับบท สร้างแบบทดสอบ ใบงาน และกิจกรรม */
export default function AssistantScreen() {
  const toast = useToast();
  const guard = useCreditGuard();
  const scrollRef = useRef<ScrollView>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageRow[]>([]);
  const [draft, setDraft] = useState('');

  const send = useMutation({
    mutationFn: async (text: string) => {
      const result = await guard.run('assistant', 1, () =>
        sendAssistantMessage({ thread_id: threadId, message: text }),
      );

      if (!result) {
        throw new Error('__handled__');
      }

      return result;
    },
    onSuccess: (result) => {
      setThreadId(result.thread_id);
      setMessages((current) => [...current, result.message]);
      track('assistant_used', {});

      if (result.action?.type === 'create_video') {
        router.push({ pathname: '/(tabs)/create', params: { prompt: result.action.prompt } });
      }
    },
    onError: (error) => {
      if (error.message !== '__handled__') {
        toast.error(errorMessage(error));
      }
    },
  });

  const submit = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        thread_id: threadId ?? '',
        role: 'user',
        content: trimmed,
        artifact: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setDraft('');
    send.mutate(trimmed);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, send.isPending]);

  return (
    <View style={styles.flex}>
      <GradientHeader
        title="🤖 น้อง Teacher AI"
        subtitle="ผู้ช่วยผลิตสื่อการสอนส่วนตัวของคุณ"
        showBack
        tone="ai"
        right={<IconButton icon="close" label="ปิด" background="rgba(255,255,255,0.18)" color={colors.onPrimary} onPress={() => router.back()} />}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <Card style={styles.introCard}>
              <Text variant="h3">สวัสดีครับคุณครู 👋</Text>
              <Text variant="small" color={colors.textSecondary}>
                ถามอะไรก็ได้เกี่ยวกับการผลิตสื่อการสอน ผมช่วยสร้างแบบทดสอบ ใบงาน คำถามท้ายบท
                Exit Ticket กิจกรรม และใบความรู้ให้ได้ทันที
              </Text>
              <View style={styles.quickPrompts}>
                {ASSISTANT_QUICK_PROMPTS.map((item) => (
                  <Pressable
                    key={item.prompt}
                    onPress={() => submit(item.prompt)}
                    style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
                  >
                    <Text variant="small" color={colors.primary}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.bubble, message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
            >
              <Text variant="body" color={message.role === 'user' ? colors.onPrimary : colors.text}>
                {message.content}
              </Text>
            </View>
          ))}

          {send.isPending ? <AIThinking message="กำลังคิดคำตอบให้คุณครู…" /> : null}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.composerInput}>
            <Input
              value={draft}
              onChangeText={setDraft}
              placeholder="พิมพ์คำถาม เช่น ช่วยปรับ Script ให้สนุกขึ้น"
              multiline
              onSubmitEditing={() => submit(draft)}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ส่งข้อความ"
            disabled={!draft.trim() || send.isPending}
            onPress={() => submit(draft)}
            style={({ pressed }) => [styles.sendButton, (!draft.trim() || send.isPending) && styles.disabled, pressed && styles.pressed]}
          >
            <Ionicons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <InsufficientCreditsSheet
        visible={guard.visible}
        required={guard.required}
        balance={guard.balance}
        action={guard.action}
        onClose={guard.dismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  introCard: { gap: spacing.md },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  bubble: { maxWidth: '86%', padding: spacing.md, borderRadius: radius.lg },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerInput: { flex: 1 },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});
