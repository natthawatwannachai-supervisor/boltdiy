import { supabase } from '@/lib/supabase';
import { unwrap } from './client';
import type { Project } from '@/types/domain';

export const listProjects = async () =>
  unwrap(
    await supabase
      .from('projects')
      .select('*, videos(count)')
      .order('updated_at', { ascending: false }),
  ).map((row) => {
    const { videos, ...project } = row as Project & { videos?: { count: number }[] };

    return { ...project, video_count: videos?.[0]?.count ?? 0 } as Project;
  });

export const getProject = async (id: string) =>
  unwrap(await supabase.from('projects').select('*').eq('id', id).single()) as Project;

export const createProject = async (input: {
  name: string;
  description?: string | null;
  subject?: Project['subject'];
  grade_level?: Project['grade_level'];
  color?: string;
}) => {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error('กรุณาเข้าสู่ระบบก่อน');
  }

  return unwrap(
    await supabase
      .from('projects')
      .insert({
        owner_id: auth.user.id,
        name: input.name,
        description: input.description ?? null,
        subject: input.subject ?? null,
        grade_level: input.grade_level ?? null,
        color: input.color ?? '#1D4ED8',
      })
      .select('*')
      .single(),
  ) as Project;
};

export const updateProject = async (id: string, patch: Partial<Project>) =>
  unwrap(await supabase.from('projects').update(patch).eq('id', id).select('*').single()) as Project;

export const deleteProject = async (id: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    throw error;
  }
};

/** ทำสำเนาโปรเจกต์พร้อมวิดีโอทั้งหมดเป็นแบบร่าง เพื่อใช้เป็นเทมเพลตของปีการศึกษาถัดไป */
export const duplicateProject = async (id: string, name?: string) => {
  const { data, error } = await supabase.rpc('duplicate_project' as never, {
    p_project_id: id,
    p_name: name ?? null,
  } as never);

  if (error) {
    throw error;
  }

  return data as unknown as string;
};
