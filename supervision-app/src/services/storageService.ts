import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { RecordImage } from '@/types';

const safeName = (name: string) =>
  name
    .normalize('NFC')
    .replace(/[^\w.\-฀-๿]+/g, '_')
    .slice(-80);

function upload(path: string, file: File, onProgress?: (percent: number) => void) {
  const task: UploadTask = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000',
  });

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

/** `users/{uid}/signature/...` — one signature per user. */
export async function uploadSignature(uid: string, file: File): Promise<RecordImage> {
  const path = `users/${uid}/signature/${Date.now()}-${safeName(file.name)}`;
  const url = await upload(path, file);

  return { url, path, name: file.name, size: file.size };
}

/** `supervisions/{uid}/{recordId}/...` — max two photos per record. */
export async function uploadRecordImage(
  uid: string,
  recordId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<RecordImage> {
  const path = `supervisions/${uid}/${recordId}/${Date.now()}-${safeName(file.name)}`;
  const url = await upload(path, file, onProgress);

  return { url, path, name: file.name, size: file.size };
}

/** Deleting storage objects is best-effort: a missing file must not break a flow. */
export async function deleteByPath(path: string | null | undefined): Promise<void> {
  if (!path) {
    return;
  }

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found') {
      console.warn('[storage] failed to delete', path, error);
    }
  }
}

export const deleteImages = (images: RecordImage[]) =>
  Promise.all(images.map((image) => deleteByPath(image.path)));
