import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuCard } from '@/components/ui/NeuCard';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { FullPageLoader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import { SupervisionForm, type SupervisionSubmit } from '@/components/supervision/SupervisionForm';
import { PaperlessScene } from '@/components/illustrations/Scene3D';
import { createRecord } from '@/services/supervisionService';
import { authErrorMessage } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CONTENT_MAX_LENGTH, MAX_IMAGES_PER_RECORD } from '@/config/constants';

export default function RecordSupervisionPage() {
  const { user, profile } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (!user) {
    return <FullPageLoader />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <NeuCard className="p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-ink-800">ไม่พบข้อมูลโปรไฟล์</h2>
          <p className="mt-2 text-sm text-ink-500">
            บัญชีนี้ยังไม่มีข้อมูลศึกษานิเทศก์ในระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลโปรไฟล์
          </p>
        </NeuCard>
      </div>
    );
  }

  const handleSubmit = async ({ values, files }: SupervisionSubmit) => {
    setSubmitting(true);
    setProgress(0);

    try {
      await createRecord(
        {
          ...values,
          userId: user.uid,
          supervisorName: profile.fullName,
          supervisorPosition: profile.position,
          files,
        },
        setProgress,
      );

      setSuccessOpen(true);
      setFormKey((key) => key + 1); // remount to reset the form
    } catch (saveError) {
      error(authErrorMessage(saveError));
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="บันทึกข้อมูล"
        title="บันทึกการนิเทศ ติดตาม และประเมินผล"
        description={`กรอกรายละเอียดการนิเทศ แนบภาพประกอบได้สูงสุด ${MAX_IMAGES_PER_RECORD} รูป และสรุปผลไม่เกิน ${CONTENT_MAX_LENGTH} ตัวอักษร`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_15rem] lg:items-start">
        <NeuCard className="p-6 sm:p-8">
          <SupervisionForm
            key={formKey}
            supervisorName={profile.fullName}
            submitting={submitting}
            progress={progress}
            onSubmit={handleSubmit}
          />
        </NeuCard>

        <aside className="hidden lg:block">
          <NeuCard variant="flat" className="p-5">
            <PaperlessScene />
            <h3 className="mt-2 text-center font-display text-base font-semibold text-ink-800">
              บันทึกครั้งเดียว ใช้ได้ทั้งเดือน
            </h3>
            <p className="mt-1 text-center text-xs leading-relaxed text-ink-500">
              ทุกรายการที่บันทึกจะถูกนำไปสรุปในแดชบอร์ดและรายงาน PDF ประจำเดือนโดยอัตโนมัติ
            </p>
          </NeuCard>
        </aside>
      </div>

      <SuccessDialog
        open={successOpen}
        title="บันทึกข้อมูลสำเร็จ!"
        message="ข้อมูลการนิเทศถูกจัดเก็บเรียบร้อยแล้ว คุณสามารถบันทึกรายการถัดไป หรือไปดูสรุปที่แดชบอร์ดได้ทันที"
        actionLabel="ไปที่แดชบอร์ด"
        onClose={() => setSuccessOpen(false)}
        onAction={() => {
          setSuccessOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}
