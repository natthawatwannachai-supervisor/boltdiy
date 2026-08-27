import { json, serveJson } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';

/**
 * ลบบัญชีถาวรตาม PDPA (สเปกข้อ 35)
 * ลบไฟล์ใน Storage ก่อน แล้วจึงลบผู้ใช้ ซึ่ง cascade ลบข้อมูลในทุกตาราง
 */
Deno.serve(
  serveJson(async (req) => {
    const { user } = await requireUser(req);
    const service = serviceClient();

    const { data: assets } = await service
      .from('assets')
      .select('kind, storage_path')
      .eq('owner_id', user.id);

    const buckets: Record<string, string[]> = {
      'scene-images': [],
      'scene-audio': [],
      videos: [],
      thumbnails: [],
    };

    for (const asset of (assets ?? []) as { kind: string; storage_path: string }[]) {
      const bucket =
        asset.kind === 'image'
          ? 'scene-images'
          : asset.kind === 'audio'
            ? 'scene-audio'
            : asset.kind === 'thumbnail'
              ? 'thumbnails'
              : 'videos';

      buckets[bucket].push(asset.storage_path);
    }

    for (const [bucket, paths] of Object.entries(buckets)) {
      if (paths.length) {
        const { error } = await service.storage.from(bucket).remove(paths);

        if (error) {
          console.error(`[account-delete] ลบไฟล์ใน ${bucket} ไม่สำเร็จ`, error.message);
        }
      }
    }

    const { error } = await service.auth.admin.deleteUser(user.id);

    if (error) {
      throw new Error(`ลบบัญชีไม่สำเร็จ: ${error.message}`);
    }

    return json({ deleted: true });
  }),
);
