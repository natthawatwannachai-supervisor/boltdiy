import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput, NeuSelect, NeuTextarea } from '@/components/ui/NeuField';
import { ImageUploader, type PendingImage } from './ImageUploader';
import { CONTENT_MAX_LENGTH, SUPERVISION_CATEGORIES } from '@/config/constants';
import { countThaiCharacters, hasErrors, truncateThai, validateSupervision } from '@/utils/validation';
import { todayISO } from '@/utils/date';
import type { RecordImage, SupervisionFormValues } from '@/types';
import { cn } from '@/utils/cn';

export interface SupervisionSubmit {
  values: SupervisionFormValues;
  files: File[];
  keptImages: RecordImage[];
}

interface SupervisionFormProps {
  supervisorName: string;
  initialValues?: Partial<SupervisionFormValues>;
  initialImages?: RecordImage[];
  submitting?: boolean;
  progress?: number;
  submitLabel?: string;
  onSubmit: (payload: SupervisionSubmit) => Promise<void> | void;
  onCancel?: () => void;
}

const defaults = (): SupervisionFormValues => ({
  category: SUPERVISION_CATEGORIES[0],
  topic: '',
  location: '',
  content: '',
  startDate: todayISO(),
  endDate: todayISO(),
  startTime: '09:00',
  endTime: '16:30',
});

export function SupervisionForm({
  supervisorName,
  initialValues,
  initialImages = [],
  submitting = false,
  progress = 0,
  submitLabel = 'บันทึกข้อมูล',
  onSubmit,
  onCancel,
}: SupervisionFormProps) {
  const [values, setValues] = useState<SupervisionFormValues>({
    ...defaults(),
    ...initialValues,
  });
  const [keptImages, setKeptImages] = useState<RecordImage[]>(initialImages);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [errors, setErrors] = useState<ReturnType<typeof validateSupervision>>({});

  const set = <K extends keyof SupervisionFormValues>(key: K, value: SupervisionFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const contentLength = useMemo(() => countThaiCharacters(values.content), [values.content]);
  const contentRatio = Math.min(contentLength / CONTENT_MAX_LENGTH, 1);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateSupervision(values);

    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      return;
    }

    await onSubmit({
      values: { ...values, topic: values.topic.trim(), location: values.location.trim(), content: values.content.trim() },
      files: pending.map((image) => image.file),
      keptImages,
    });

    setPending([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeuInput
          label="วันที่เริ่มต้น"
          type="date"
          required
          value={values.startDate}
          error={errors.startDate}
          onChange={(event) => {
            const startDate = event.target.value;

            set('startDate', startDate);

            // Keep the range valid without making the user fix it by hand.
            if (values.endDate < startDate) {
              set('endDate', startDate);
            }
          }}
        />

        <NeuInput
          label="วันที่สิ้นสุด"
          type="date"
          required
          min={values.startDate}
          value={values.endDate}
          error={errors.endDate}
          onChange={(event) => set('endDate', event.target.value)}
        />

        <NeuInput
          label="เวลาเริ่มต้น"
          type="time"
          required
          value={values.startTime}
          error={errors.startTime}
          onChange={(event) => set('startTime', event.target.value)}
        />

        <NeuInput
          label="เวลาสิ้นสุด"
          type="time"
          required
          value={values.endTime}
          error={errors.endTime}
          onChange={(event) => set('endTime', event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NeuInput
          label="ชื่อผู้นิเทศ"
          value={supervisorName}
          readOnly
          disabled
          hint="ดึงมาจากโปรไฟล์ของคุณโดยอัตโนมัติ"
        />

        <NeuSelect
          label="งานนิเทศ"
          required
          options={SUPERVISION_CATEGORIES}
          value={values.category}
          error={errors.category}
          onChange={(event) => set('category', event.target.value)}
          hint="ใช้จัดหมวดหมู่ตารางในรายงาน PDF"
        />

        <NeuInput
          label="เรื่องที่นิเทศ"
          required
          placeholder="เช่น การนิเทศการจัดการเรียนรู้เชิงรุก (Active Learning)"
          value={values.topic}
          error={errors.topic}
          onChange={(event) => set('topic', event.target.value)}
        />

        <NeuInput
          label="สถานที่นิเทศ"
          required
          placeholder="เช่น โรงเรียนบ้านสวรรคโลก"
          value={values.location}
          error={errors.location}
          onChange={(event) => set('location', event.target.value)}
        />
      </div>

      <div>
        <NeuTextarea
          label="เนื้อหา/ผลการนิเทศ"
          required
          placeholder="สรุปสาระสำคัญของการนิเทศ ข้อค้นพบ และข้อเสนอแนะ"
          value={values.content}
          error={errors.content}
          onChange={(event) => set('content', truncateThai(event.target.value))}
        />

        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neu-200 shadow-neu-inset-sm">
            <motion.div
              className={cn(
                'h-full rounded-full',
                contentRatio >= 1
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : contentRatio > 0.85
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-brand-gradient',
              )}
              animate={{ width: `${contentRatio * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            />
          </div>
          <span
            className={cn(
              'shrink-0 text-xs font-semibold tabular-nums',
              contentRatio >= 1 ? 'text-rose-600' : 'text-ink-500',
            )}
          >
            {contentLength} / {CONTENT_MAX_LENGTH} ตัวอักษร
          </span>
        </div>
      </div>

      <ImageUploader
        existing={keptImages}
        onExistingChange={setKeptImages}
        pending={pending}
        onPendingChange={setPending}
        disabled={submitting}
      />

      {submitting && progress > 0 && (
        <div className="rounded-2xl bg-neu-200 px-4 py-3 shadow-neu-inset">
          <div className="mb-2 flex justify-between text-xs font-medium text-ink-500">
            <span>กำลังอัปโหลดรูปภาพ</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neu-300">
            <motion.div
              className="h-full rounded-full bg-brand-gradient"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <NeuButton type="button" variant="neu" onClick={onCancel} disabled={submitting}>
            ยกเลิก
          </NeuButton>
        )}
        <NeuButton type="submit" loading={submitting} className="sm:min-w-[12rem]">
          {submitLabel}
        </NeuButton>
      </div>
    </form>
  );
}
