import { Modal } from './Modal';
import { NeuButton } from './NeuButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  loading = false,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-neu ${
            destructive
              ? 'bg-gradient-to-br from-rose-500 to-red-600'
              : 'bg-brand-gradient'
          }`}
        >
          {destructive ? '!' : '?'}
        </div>

        <h3 className="font-display text-xl font-bold text-ink-800">{title}</h3>
        <p className="mt-2 text-sm text-ink-500">{message}</p>

        <div className="mt-7 flex gap-3">
          <NeuButton variant="neu" fullWidth onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </NeuButton>
          <NeuButton
            variant={destructive ? 'danger' : 'primary'}
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </NeuButton>
        </div>
      </div>
    </Modal>
  );
}
