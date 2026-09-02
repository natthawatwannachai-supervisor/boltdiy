import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IMAGE_TARGET_MAX_KB,
  IMAGE_TARGET_MIN_KB,
  MAX_IMAGES_PER_RECORD,
} from '@/config/constants';
import { compressToTarget, formatBytes } from '@/utils/imageCompression';
import type { RecordImage } from '@/types';
import { cn } from '@/utils/cn';

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

interface ImageUploaderProps {
  /** Images already stored on the record (edit mode). */
  existing?: RecordImage[];
  onExistingChange?: (images: RecordImage[]) => void;
  pending: PendingImage[];
  onPendingChange: (images: PendingImage[]) => void;
  disabled?: boolean;
}

/**
 * Accepts at most two photos and compresses each one into the 200–300 KB
 * window *before* it ever reaches Firebase Storage.
 */
export function ImageUploader({
  existing = [],
  onExistingChange,
  pending,
  onPendingChange,
  disabled,
}: ImageUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);

  useEffect(
    () => () => {
      previews.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const used = existing.length + pending.length;
  const remaining = MAX_IMAGES_PER_RECORD - used;

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || disabled) {
      return;
    }

    setError(null);

    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));

    if (files.length < fileList.length) {
      setError('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
    }

    if (!files.length) {
      return;
    }

    if (files.length > remaining) {
      setError(`แนบรูปได้สูงสุด ${MAX_IMAGES_PER_RECORD} รูปต่อการบันทึก 1 ครั้ง`);
    }

    setBusy(true);

    const accepted: PendingImage[] = [];

    for (const file of files.slice(0, remaining)) {
      try {
        const result = await compressToTarget(file, setProgress);
        const preview = URL.createObjectURL(result.file);

        previews.current.push(preview);
        accepted.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file: result.file,
          preview,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
        });
      } catch (compressionError) {
        console.error(compressionError);
        setError('บีบอัดรูปภาพไม่สำเร็จ กรุณาลองใหม่หรือเลือกไฟล์อื่น');
      }
    }

    onPendingChange([...pending, ...accepted]);
    setBusy(false);
    setProgress(0);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="neu-label">
        ภาพประกอบการนิเทศ (สูงสุด {MAX_IMAGES_PER_RECORD} รูป)
      </span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'rounded-neu bg-neu-200 p-4 shadow-neu-inset transition-all',
          dragging && 'ring-2 ring-brand-500',
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {existing.map((image) => (
              <motion.figure
                key={image.path}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-2xl bg-neu-200 shadow-neu"
              >
                <img src={image.url} alt={image.name} className="h-40 w-full object-cover" />
                <figcaption className="flex items-center justify-between px-3 py-2 text-[11px] text-ink-500">
                  <span className="truncate">{image.name}</span>
                  <span>{formatBytes(image.size)}</span>
                </figcaption>
                <button
                  type="button"
                  aria-label="ลบรูปนี้"
                  disabled={disabled}
                  onClick={() =>
                    onExistingChange?.(existing.filter((entry) => entry.path !== image.path))
                  }
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-neu-sm transition-transform hover:scale-105"
                >
                  ✕
                </button>
              </motion.figure>
            ))}

            {pending.map((image) => (
              <motion.figure
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-2xl bg-neu-200 shadow-neu"
              >
                <img src={image.preview} alt={image.file.name} className="h-40 w-full object-cover" />
                <figcaption className="flex items-center justify-between px-3 py-2 text-[11px] text-ink-500">
                  <span className="truncate">{image.file.name}</span>
                  <span className="font-medium text-brand-600">
                    {formatBytes(image.originalSize)} → {formatBytes(image.compressedSize)}
                  </span>
                </figcaption>
                <button
                  type="button"
                  aria-label="ลบรูปนี้"
                  disabled={disabled}
                  onClick={() => onPendingChange(pending.filter((entry) => entry.id !== image.id))}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-neu-sm transition-transform hover:scale-105"
                >
                  ✕
                </button>
              </motion.figure>
            ))}

            {remaining > 0 && (
              <motion.button
                key="picker"
                layout
                type="button"
                disabled={disabled || busy}
                onClick={() => inputRef.current?.click()}
                className="flex h-[11.75rem] flex-col items-center justify-center gap-2 rounded-2xl bg-neu-200 text-ink-500 shadow-neu transition-all hover:text-brand-600 active:shadow-neu-inset disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
                    <span className="text-xs font-medium">กำลังบีบอัดรูป {progress}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📷</span>
                    <span className="text-sm font-medium">เพิ่มรูปภาพ ({remaining} รูป)</span>
                    <span className="px-4 text-center text-[11px] text-ink-400">
                      ระบบจะย่อขนาดอัตโนมัติให้อยู่ที่ {IMAGE_TARGET_MIN_KB}–{IMAGE_TARGET_MAX_KB} KB
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {error && <p className="neu-error">{error}</p>}
    </div>
  );
}
