import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { NotificationRow } from '@/types/database';

export const listNotifications = async (limit = 50) =>
  unwrap(
    await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit),
  ) as NotificationRow[];

export const countUnread = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const markAllRead = async () => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) {
    throw error;
  }
};

export const registerPushToken = async (userId: string, token: string, platform: string) => {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform, created_at: new Date().toISOString() }, { onConflict: 'token' });

  if (error) {
    throw error;
  }
};

export const subscribeToNotifications = (userId: string, onInsert: (row: NotificationRow) => void) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as NotificationRow),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
