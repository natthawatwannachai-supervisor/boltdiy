import { useState } from 'react';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { useAuth } from '@/context/AuthContext';

/**
 * Owns the login/register modal pair and the registration success hand-off:
 * register -> success popup -> login modal (email pre-filled) -> dashboard.
 */
export function AuthModals() {
  const { authModal, openAuthModal, closeAuthModal } = useAuth();
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <>
      <LoginModal
        open={authModal === 'login'}
        presetEmail={registeredEmail}
        onClose={closeAuthModal}
        onSwitchToRegister={() => openAuthModal('register')}
      />

      <RegisterModal
        open={authModal === 'register'}
        onClose={closeAuthModal}
        onSwitchToLogin={() => openAuthModal('login')}
        onRegistered={(email) => {
          setRegisteredEmail(email);
          closeAuthModal();
          setSuccessOpen(true);
        }}
      />

      <SuccessDialog
        open={successOpen}
        title="ลงทะเบียนสำเร็จ!"
        message="บัญชีของคุณพร้อมใช้งานแล้ว กรุณาเข้าสู่ระบบเพื่อเริ่มบันทึกการนิเทศ"
        actionLabel="ไปหน้าเข้าสู่ระบบ"
        onClose={() => setSuccessOpen(false)}
        onAction={() => {
          setSuccessOpen(false);
          openAuthModal('login');
        }}
      />
    </>
  );
}
