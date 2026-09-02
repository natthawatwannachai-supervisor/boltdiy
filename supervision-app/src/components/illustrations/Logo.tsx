import { motion } from 'framer-motion';
import { LOGO_URL } from '@/config/constants';
import { cn } from '@/utils/cn';

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Renders the office logo from `public/logo.svg` (override with VITE_LOGO_URL).
 * The very same asset is embedded at the top of every generated PDF report.
 */
export function Logo({ size = 48, className, animated = true }: LogoProps) {
  return (
    <motion.div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-neu-200 p-1.5 shadow-neu-sm',
        className,
      )}
      style={{ width: size, height: size }}
      whileHover={animated ? { rotate: 8, scale: 1.06 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      <img
        src={LOGO_URL}
        alt="ตราสัญลักษณ์ระบบบันทึกรายงานการนิเทศฯ สพป.สุโขทัย เขต 2"
        className="h-full w-full object-contain"
        width={size}
        height={size}
      />
    </motion.div>
  );
}
