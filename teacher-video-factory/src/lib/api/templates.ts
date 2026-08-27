import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { SubjectKey, Template } from '@/types/domain';

export const listTemplates = async (params?: { subject?: SubjectKey | 'all'; search?: string }) => {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });

  if (params?.subject && params.subject !== 'all') {
    query = query.eq('subject', params.subject);
  }

  if (params?.search?.trim()) {
    query = query.ilike('title', `%${params.search.trim()}%`);
  }

  return unwrap(await query) as Template[];
};

export const listMyTemplates = async () =>
  unwrap(
    await supabase.from('templates').select('*').eq('is_official', false).order('created_at', { ascending: false }),
  ) as Template[];

export const getTemplate = async (id: string) =>
  unwrap(await supabase.from('templates').select('*').eq('id', id).single()) as Template;

export const createTemplateFromVideo = async (videoId: string, input: { title: string; description?: string; is_public: boolean }) => {
  const { data, error } = await supabase.rpc('create_template_from_video' as never, {
    p_video_id: videoId,
    p_title: input.title,
    p_description: input.description ?? null,
    p_is_public: input.is_public,
  } as never);

  if (error) {
    throw error;
  }

  return data as unknown as string;
};
