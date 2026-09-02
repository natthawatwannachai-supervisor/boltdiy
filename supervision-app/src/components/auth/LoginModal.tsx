import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuCheckbox, NeuInput } from '@/components/ui/NeuField';
import { Logo } from '@/components/illustrations/Logo';
import { authErrorMessage, requestPasswordReset, resolveLoginIdentifier } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ADMIN_USERNAME } from '@/config/constants';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  /** Pre-filled after a successful registration. */
  presetEmail?: string;
}

export function LoginModal({ open, onClose, onSwitchToRegister, presetEmail }: LoginModalProps) {
  const [identifier, setIdentifier] = useState(presetEmail ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // The modal stays mounted while closed, so the email handed over after a
  // successful registration has to be synced in when the modal is opened.
  useEffect(() => {
    if (open && presetEmail) {
      setIdentifier(presetEmail);
    }
  }, [open, presetEmail]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน');

      return;
    }

    setSubmitting(true);

    try {
      const { isAdmin } = await signIn(identifier, password, rememberMe);

      success('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ');
      setPassword('');
      onClose();
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    const email = resolveLoginIdentifier(identifier);

    if (!email.includes('@')) {
      setError('กรุณากรอกอีเมลของคุณก่อน แล้วกดลืมรหัสผ่านอีกครั้ง');

      return;
    }

    try {
      await requestPasswordReset(email);
      success('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว');
    } catch (resetError) {
      toastError(authErrorMessage(resetError));
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <Logo size={72} />
        </motion.div>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink-800">เข้าสู่ระบบ</h2>
        <p className="mt-1 text-sm text-ink-500">
          สำหรับศึกษานิเทศก์ สพป.สุโขทัย เขต 2
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="อีเมล หรือ ชื่อผู้ใช้"
          type="text"
          autoComplete="username"
          placeholder={`เช่น supervisor@sukhothai2.go.th หรือ ${ADMIN_USERNAME}`}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          leading="✉️"
        />

        <NeuInput
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          placeholder="รหัสผ่านของคุณ"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leading="🔒"
        />

        <div className="flex items-center justify-between gap-3">
          <NeuCheckbox
            label="จดจำการเข้าสู่ระบบ"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        <p className="rounded-2xl bg-neu-200 px-4 py-2 text-[11px] leading-relaxed text-ink-400 shadow-neu-inset-sm">
          หากไม่เลือก “จดจำการเข้าสู่ระบบ” ระบบจะให้เข้าสู่ระบบใหม่ทุกครั้งที่เปิดเบราว์เซอร์
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-neu-inset-sm"
          >
            {error}
          </motion.p>
        )}

        <NeuButton type="submit" fullWidth loading={submitting}>
          เข้าสู่ระบบ
        </NeuButton>

        <p className="text-center text-sm text-ink-500">
          ยังไม่มีบัญชีผู้ใช้?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-brand-600 hover:underline"
          >
            ลงทะเบียนที่นี่
          </button>
        </p>
      </form>
    </Modal>
  );
}
