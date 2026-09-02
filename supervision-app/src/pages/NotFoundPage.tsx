import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NeuButton } from '@/components/ui/NeuButton';
import { PaperlessScene } from '@/components/illustrations/Scene3D';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-64"
      >
        <PaperlessScene />
      </motion.div>

      <h1 className="mt-4 font-display text-5xl font-bold text-gradient">404</h1>
      <p className="mt-2 text-lg font-semibold text-ink-700">ไม่พบหน้าที่คุณกำลังค้นหา</p>
      <p className="mt-1 text-sm text-ink-500">
        หน้านี้อาจถูกย้ายหรือลบไปแล้ว กรุณากลับไปที่หน้าแรกเพื่อใช้งานต่อ
      </p>

      <Link to="/" className="mt-8">
        <NeuButton>กลับสู่หน้าแรก</NeuButton>
      </Link>
    </div>
  );
}
