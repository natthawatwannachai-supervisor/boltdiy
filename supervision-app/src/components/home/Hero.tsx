import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NeuButton } from '@/components/ui/NeuButton';
import { SupervisorScene } from '@/components/illustrations/Scene3D';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME, ORGANISATION } from '@/config/constants';

const HIGHLIGHTS = [
  { icon: '⏱️', label: 'ลดเวลาทำเอกสาร', value: 'เร็วขึ้น 80%' },
  { icon: '🌿', label: 'ลดการใช้กระดาษ', value: 'Paperless 100%' },
  { icon: '📈', label: 'ประสิทธิภาพงาน', value: 'ติดตามได้ทันที' },
];

export function Hero() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-16">
        <div>
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="chip-brand mb-5"
          >
            ✨ ระบบราชการยุคดิจิทัล • ลดภาระงานเอกสาร
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance font-display text-3xl font-bold leading-tight text-ink-800 sm:text-4xl lg:text-[2.75rem]"
          >
            {APP_NAME}
            <span className="mt-2 block text-gradient">{ORGANISATION}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-ink-500"
          >
            บันทึกผลการนิเทศ ติดตาม และประเมินผลการจัดการศึกษาได้ทุกที่ทุกเวลา
            ลดการใช้กระดาษ ประหยัดเวลา และสรุปรายงานประจำเดือนเป็นไฟล์ PDF
            พร้อมลายเซ็นได้ในคลิกเดียว
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {user ? (
              <>
                <NeuButton onClick={() => navigate('/record')}>เริ่มบันทึกการนิเทศ</NeuButton>
                <NeuButton variant="neu" onClick={() => navigate('/dashboard')}>
                  ไปที่แดชบอร์ด
                </NeuButton>
              </>
            ) : (
              <>
                <NeuButton onClick={() => openAuthModal('register')}>ลงทะเบียนใช้งานฟรี</NeuButton>
                <NeuButton variant="neu" onClick={() => openAuthModal('login')}>
                  เข้าสู่ระบบ
                </NeuButton>
              </>
            )}
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-neu bg-neu-200 px-4 py-4 shadow-neu">
                <span className="text-2xl">{item.icon}</span>
                <dd className="mt-2 font-display text-lg font-bold text-gradient">{item.value}</dd>
                <dt className="text-xs text-ink-500">{item.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute inset-6 rounded-full bg-brand-300/25 blur-3xl" />
          <SupervisorScene className="relative" />
        </motion.div>
      </div>
    </section>
  );
}
