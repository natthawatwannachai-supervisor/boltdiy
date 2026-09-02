import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hero } from '@/components/home/Hero';
import { Benefits } from '@/components/home/Benefits';
import { MotionInfographic } from '@/components/home/MotionInfographic';
import { NeuButton } from '@/components/ui/NeuButton';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Hero />
      <Benefits />
      <MotionInfographic />

      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-neu-lg bg-brand-gradient px-6 py-12 text-center text-white shadow-brand-glow-lg sm:px-12">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[24px] border-white/10"
            />
            <motion.span
              animate={{ y: [0, 18, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
            />

            <h2 className="relative font-display text-2xl font-bold sm:text-3xl">
              พร้อมเริ่มบันทึกการนิเทศแบบไร้กระดาษแล้วหรือยัง?
            </h2>
            <p className="relative mx-auto mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
              ลงทะเบียนเพียงครั้งเดียว แล้วบันทึกงานนิเทศได้ทุกที่ทุกเวลา
              พร้อมออกรายงานสรุปประจำเดือนให้อัตโนมัติ
            </p>

            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <>
                  <NeuButton
                    variant="neu"
                    className="!bg-white !text-brand-700 !shadow-lg"
                    onClick={() => navigate('/record')}
                  >
                    บันทึกการนิเทศ
                  </NeuButton>
                  <NeuButton
                    variant="neu"
                    className="!bg-white/15 !text-white !shadow-none ring-1 ring-white/40"
                    onClick={() => navigate('/dashboard')}
                  >
                    ดูแดชบอร์ด
                  </NeuButton>
                </>
              ) : (
                <>
                  <NeuButton
                    variant="neu"
                    className="!bg-white !text-brand-700 !shadow-lg"
                    onClick={() => openAuthModal('register')}
                  >
                    ลงทะเบียนเลย
                  </NeuButton>
                  <NeuButton
                    variant="neu"
                    className="!bg-white/15 !text-white !shadow-none ring-1 ring-white/40"
                    onClick={() => navigate('/how-to-use')}
                  >
                    ดูวิธีใช้งาน
                  </NeuButton>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
