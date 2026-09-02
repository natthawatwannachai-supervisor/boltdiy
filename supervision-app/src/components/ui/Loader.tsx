import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent',
        className,
      )}
    />
  );
}

export function FullPageLoader({ label = 'กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="h-16 w-16 rounded-full border-4 border-neu-400 border-t-brand-500 shadow-neu"
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="text-sm font-medium text-ink-500"
      >
        {label}
      </motion.p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-neu bg-neu-200 px-6 py-16 text-center shadow-neu-inset">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-neu-200 text-3xl shadow-neu"
      >
        📋
      </motion.div>
      <h3 className="font-display text-lg font-semibold text-ink-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
