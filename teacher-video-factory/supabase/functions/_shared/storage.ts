import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http.ts';

/** อัปโหลดไฟล์ที่ AI สร้างขึ้นเข้า Storage แล้วคืน public URL */
export const uploadGenerated = async (
  service: SupabaseClient,
  input: {
    bucket: 'scene-images' | 'scene-audio' | 'videos' | 'thumbnails';
    ownerId: string;
    videoId: string;
    fileName: string;
    bytes: Uint8Array;
    contentType: string;
    sceneId?: string | null;
    provider?: string;
  },
): Promise<{ path: string; publicUrl: string }> => {
  const path = `${input.ownerId}/${input.videoId}/${input.fileName}`;

  const { error } = await service.storage.from(input.bucket).upload(path, input.bytes, {
    contentType: input.contentType,
    upsert: true,
  });

  if (error) {
    throw new HttpError('UNKNOWN', `อัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
  }

  const { data } = service.storage.from(input.bucket).getPublicUrl(path);

  await service.from('assets').insert({
    owner_id: input.ownerId,
    video_id: input.videoId,
    scene_id: input.sceneId ?? null,
    kind:
      input.bucket === 'scene-images'
        ? 'image'
        : input.bucket === 'scene-audio'
          ? 'audio'
          : input.bucket === 'thumbnails'
            ? 'thumbnail'
            : 'video',
    storage_path: path,
    public_url: data.publicUrl,
    mime_type: input.contentType,
    bytes: input.bytes.byteLength,
    provider: input.provider ?? null,
  });

  return { path, publicUrl: data.publicUrl };
};

/** ลิงก์ดาวน์โหลดชั่วคราวสำหรับ bucket ที่ไม่เปิดสาธารณะ */
export const signedUrl = async (
  service: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSec = 3600,
) => {
  const { data, error } = await service.storage.from(bucket).createSignedUrl(path, expiresInSec);

  if (error || !data) {
    throw new HttpError('NOT_FOUND', 'สร้างลิงก์ดาวน์โหลดไม่สำเร็จ');
  }

  return data.signedUrl;
};
