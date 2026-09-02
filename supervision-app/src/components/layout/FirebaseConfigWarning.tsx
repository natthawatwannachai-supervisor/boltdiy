import { motion } from 'framer-motion';
import { isFirebaseConfigured } from '@/config/firebase';

/**
 * Without a Firebase project every auth/database call fails with an opaque
 * error, so say so plainly during setup rather than letting the UI look broken.
 */
export function FirebaseConfigWarning() {
  if (isFirebaseConfigured) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[80] bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm"
    >
      ยังไม่ได้ตั้งค่า Firebase — คัดลอก <code className="font-mono">.env.example</code> เป็น{' '}
      <code className="font-mono">.env</code> แล้วกรอกค่าจาก Firebase Console
      เพื่อให้ระบบเข้าสู่ระบบและบันทึกข้อมูลได้
    </motion.div>
  );
}
