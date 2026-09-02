import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { NeuButton } from './NeuButton';

interface SuccessDialogProps {
  open: boolean;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

/** Animated tick used for every "saved successfully" moment in the app. */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className="mx-auto"
    >
      <defs>
        <linearGradient id="successGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="url(#successGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
        }}
      />
      <motion.path
        d="M32 52 L45 64 L69 38"
        fill="none"
        stroke="url(#successGradient)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.45, delay: 0.45, ease: 'easeOut' },
          },
        }}
      />
    </motion.svg>
  );
}

export function SuccessDialog({
  open,
  title,
  message,
  actionLabel = 'ตกลง',
  onAction,
  onClose,
}: SuccessDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="text-center">
        <SuccessCheck />

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 font-display text-2xl font-bold text-gradient"
        >
          {title}
        </motion.h3>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            className="mt-2 text-sm text-ink-500"
          >
            {message}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.74 }}
          className="mt-7"
        >
          <NeuButton fullWidth onClick={onAction ?? onClose}>
            {actionLabel}
          </NeuButton>
        </motion.div>
      </div>
    </Modal>
  );
}
