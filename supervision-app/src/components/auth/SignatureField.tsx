import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { NeuButton } from '@/components/ui/NeuButton';
import { cn } from '@/utils/cn';

type Mode = 'draw' | 'upload';

interface SignatureFieldProps {
  /** Data URL (drawn) or File (uploaded). */
  value: File | string | null;
  onChange: (value: File | string | null) => void;
  error?: string;
}

/**
 * Dual-input signature capture: draw it with a finger/stylus, or upload a
 * transparent PNG that was prepared elsewhere. Either way the parent receives
 * something that can go straight to Firebase Storage.
 */
export function SignatureField({ value, onChange, error }: SignatureFieldProps) {
  const [mode, setMode] = useState<Mode>('draw');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const padRef = useRef<SignatureCanvas>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep the drawing surface pixel-accurate across resizes and DPI scales.
  const resizeCanvas = useCallback(() => {
    const canvas = padRef.current?.getCanvas();
    const wrapper = wrapperRef.current;

    if (!canvas || !wrapper) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = wrapper.getBoundingClientRect();

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.getContext('2d')?.scale(ratio, ratio);
    padRef.current?.clear();
  }, []);

  useEffect(() => {
    if (mode !== 'draw') {
      return;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [mode, resizeCanvas]);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);

      setPreview(url);

      return () => URL.revokeObjectURL(url);
    }

    setPreview(typeof value === 'string' ? value : null);

    return undefined;
  }, [value]);

  const captureDrawing = () => {
    const pad = padRef.current;

    if (!pad || pad.isEmpty()) {
      onChange(null);

      return;
    }

    // getCanvas() (not getTrimmedCanvas) keeps the transparent background.
    onChange(pad.getCanvas().toDataURL('image/png'));
  };

  const handleFile = (file?: File) => {
    setUploadError(null);

    if (!file) {
      return;
    }

    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setUploadError('รองรับเฉพาะไฟล์ PNG (แนะนำพื้นหลังโปร่งใส), JPG หรือ WEBP');

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ไฟล์ลายเซ็นต้องมีขนาดไม่เกิน 5 MB');

      return;
    }

    onChange(file);
  };

  const clear = () => {
    padRef.current?.clear();
    onChange(null);
    setUploadError(null);
  };

  return (
    <div>
      <span className="neu-label">
        ลายเซ็น<span className="ml-0.5 text-rose-500">*</span>
      </span>

      <div className="mb-3 inline-flex rounded-2xl bg-neu-200 p-1 shadow-neu-inset-sm">
        {(
          [
            { id: 'draw', label: '✍️ วาดลายเซ็น' },
            { id: 'upload', label: '⬆️ อัปโหลด PNG' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMode(tab.id);
              clear();
            }}
            className={cn(
              'relative rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
              mode === tab.id ? 'text-white' : 'text-ink-500 hover:text-brand-600',
            )}
          >
            {mode === tab.id && (
              <motion.span
                layoutId="signature-tab"
                className="absolute inset-0 rounded-xl bg-brand-gradient shadow-brand-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'draw' ? (
          <motion.div
            key="draw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              ref={wrapperRef}
              className="relative h-44 w-full overflow-hidden rounded-2xl bg-neu-200 shadow-neu-inset"
            >
              <SignatureCanvas
                ref={padRef}
                penColor="#111827"
                minWidth={1.1}
                maxWidth={2.6}
                onEnd={captureDrawing}
                canvasProps={{ className: 'h-full w-full cursor-crosshair touch-none' }}
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-ink-400">
                ลงลายมือชื่อในกรอบนี้ด้วยเมาส์ ปากกา หรือนิ้วมือ
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              <NeuButton type="button" variant="neu" className="!py-2 !text-xs" onClick={clear}>
                ล้างลายเซ็น
              </NeuButton>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label
              className="flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-neu-200 text-center shadow-neu-inset transition-colors hover:text-brand-600"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="ตัวอย่างลายเซ็น"
                  className="max-h-32 max-w-[80%] object-contain"
                />
              ) : (
                <>
                  <span className="text-3xl">🖊️</span>
                  <span className="text-sm font-medium text-ink-600">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </span>
                  <span className="text-[11px] text-ink-400">
                    แนะนำ PNG พื้นหลังโปร่งใส ขนาดไม่เกิน 5 MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {preview && (
              <div className="mt-2 flex gap-2">
                <NeuButton type="button" variant="neu" className="!py-2 !text-xs" onClick={clear}>
                  เลือกไฟล์ใหม่
                </NeuButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'draw' && preview && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-neu-200 px-4 py-2 shadow-neu-sm">
          <span className="text-xs font-medium text-brand-600">ลายเซ็นพร้อมใช้งาน</span>
          <img src={preview} alt="ตัวอย่างลายเซ็น" className="h-10 object-contain" />
        </div>
      )}

      {(error || uploadError) && <p className="neu-error">{uploadError ?? error}</p>}
    </div>
  );
}
