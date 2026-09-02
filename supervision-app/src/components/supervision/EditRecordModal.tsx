import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SupervisionForm, type SupervisionSubmit } from './SupervisionForm';
import { updateRecord } from '@/services/supervisionService';
import { authErrorMessage } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import type { SupervisionRecord } from '@/types';

interface EditRecordModalProps {
  record: SupervisionRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditRecordModal({ record, onClose, onSaved }: EditRecordModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { success, error } = useToast();

  const handleSubmit = async ({ values, files, keptImages }: SupervisionSubmit) => {
    if (!record) {
      return;
    }

    setSubmitting(true);
    setProgress(0);

    try {
      await updateRecord(record, { ...values, files, keptImages }, setProgress);
      success('แก้ไขข้อมูลการนิเทศเรียบร้อยแล้ว');
      onSaved();
      onClose();
    } catch (updateError) {
      error(authErrorMessage(updateError));
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      size="lg"
      title="แก้ไขบันทึกการนิเทศ"
      subtitle={record?.topic}
    >
      {record && (
        <SupervisionForm
          supervisorName={record.supervisorName}
          initialValues={record}
          initialImages={record.images ?? []}
          submitting={submitting}
          progress={progress}
          submitLabel="บันทึกการแก้ไข"
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
