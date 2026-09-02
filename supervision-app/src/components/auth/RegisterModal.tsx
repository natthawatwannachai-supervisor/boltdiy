import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput, NeuSelect } from '@/components/ui/NeuField';
import { SignatureField } from './SignatureField';
import { ACADEMIC_STANDINGS, DEPARTMENTS } from '@/config/constants';
import { authErrorMessage, register } from '@/services/authService';
import { hasErrors, validateRegister } from '@/utils/validation';
import type { RegisterPayload } from '@/types';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onRegistered: (email: string) => void;
}

const EMPTY: RegisterPayload = {
  fullName: '',
  position: 'ศึกษานิเทศก์',
  academicStanding: '',
  department: DEPARTMENTS[0],
  email: '',
  password: '',
  phone: '',
  lineId: '',
  signature: null,
};

export function RegisterModal({
  open,
  onClose,
  onSwitchToLogin,
  onRegistered,
}: RegisterModalProps) {
  const [values, setValues] = useState<RegisterPayload>(EMPTY);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validateRegister>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateRegister(values, confirmPassword);

    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);

    try {
      await register(values);

      const { email } = values;

      setValues(EMPTY);
      setConfirmPassword('');
      onRegistered(email.trim());
    } catch (registerError) {
      setFormError(authErrorMessage(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="ลงทะเบียนเข้าใช้งานระบบ"
      subtitle="กรอกข้อมูลให้ครบถ้วน ข้อมูลนี้จะถูกนำไปใช้ในหัวรายงานและลายเซ็นท้ายรายงาน PDF"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <NeuInput
            label="ชื่อ - นามสกุล"
            required
            placeholder="เช่น นายณัฐวัฒน์ วรรณชัย"
            value={values.fullName}
            error={errors.fullName}
            onChange={(event) => set('fullName', event.target.value)}
          />

          <NeuInput
            label="ตำแหน่ง"
            required
            placeholder="เช่น ศึกษานิเทศก์"
            value={values.position}
            error={errors.position}
            onChange={(event) => set('position', event.target.value)}
          />

          <NeuSelect
            label="วิทยฐานะ"
            required
            placeholder="- เลือกวิทยฐานะ -"
            options={ACADEMIC_STANDINGS}
            value={values.academicStanding}
            error={errors.academicStanding}
            onChange={(event) => set('academicStanding', event.target.value)}
          />

          <NeuSelect
            label="กลุ่ม/ฝ่ายงาน"
            required
            placeholder="- เลือกกลุ่ม/ฝ่ายงาน -"
            options={DEPARTMENTS}
            value={values.department}
            error={errors.department}
            onChange={(event) => set('department', event.target.value)}
          />

          <NeuInput
            label="อีเมล"
            type="email"
            required
            autoComplete="email"
            placeholder="name@sukhothai2.go.th"
            value={values.email}
            error={errors.email}
            onChange={(event) => set('email', event.target.value)}
          />

          <NeuInput
            label="เบอร์โทรศัพท์"
            type="tel"
            required
            inputMode="numeric"
            placeholder="0812345678"
            value={values.phone}
            error={errors.phone}
            onChange={(event) => set('phone', event.target.value)}
          />

          <NeuInput
            label="รหัสผ่าน"
            type="password"
            required
            autoComplete="new-password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={values.password}
            error={errors.password}
            onChange={(event) => set('password', event.target.value)}
          />

          <NeuInput
            label="ยืนยันรหัสผ่าน"
            type="password"
            required
            autoComplete="new-password"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((current) => ({ ...current, confirmPassword: undefined }));
            }}
          />

          <NeuInput
            label="Line ID"
            required
            placeholder="เช่น xdeathxsign"
            value={values.lineId}
            error={errors.lineId}
            onChange={(event) => set('lineId', event.target.value)}
            wrapperClassName="sm:col-span-2"
          />
        </div>

        <SignatureField
          value={values.signature}
          error={errors.signature}
          onChange={(signature) => set('signature', signature)}
        />

        {formError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-neu-inset-sm"
          >
            {formError}
          </motion.p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <NeuButton type="button" variant="neu" fullWidth onClick={onSwitchToLogin}>
            มีบัญชีแล้ว เข้าสู่ระบบ
          </NeuButton>
          <NeuButton type="submit" fullWidth loading={submitting}>
            ลงทะเบียน
          </NeuButton>
        </div>
      </form>
    </Modal>
  );
}
