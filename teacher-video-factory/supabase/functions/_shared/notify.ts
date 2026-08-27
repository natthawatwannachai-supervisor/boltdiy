import type { SupabaseClient } from '@supabase/supabase-js';

type Kind = 'video_ready' | 'credits' | 'system' | 'milestone';

/**
 * แจ้งเตือนผู้ใช้ 2 ทาง: บันทึกลงตาราง notifications (เห็นในแอป)
 * และส่ง push ผ่าน Expo (เห็นแม้ปิดแอปอยู่)
 */
export const notifyUser = async (
  service: SupabaseClient,
  input: { userId: string; title: string; body: string; kind: Kind; videoId?: string | null },
) => {
  await service.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    body: input.body,
    kind: input.kind,
    video_id: input.videoId ?? null,
  });

  const { data: tokens } = await service
    .from('push_tokens')
    .select('token')
    .eq('user_id', input.userId);

  if (!tokens?.length) {
    return;
  }

  const messages = tokens.map((row: { token: string }) => ({
    to: row.token,
    sound: 'default',
    title: input.title,
    body: input.body,
    data: input.videoId ? { videoId: input.videoId } : {},
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    // การแจ้งเตือนล้มเหลวไม่ควรทำให้ pipeline ทั้งหมดล้ม
    console.error('[notify] ส่ง push ไม่สำเร็จ', error);
  }
};
