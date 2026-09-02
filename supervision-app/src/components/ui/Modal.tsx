import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

const EXIT_MS = 220;

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  hideClose = false,
}: ModalProps) {
  /**
   * Presence is driven here rather than by `AnimatePresence`. An exit animation
   * that is interrupted — by a route change on the same tick as the close, for
   * instance — leaves the overlay in the DOM, where it silently swallows every
   * click on the page behind it. Owning the timing means `pointer-events` flips
   * the moment `open` does, whatever the animation ends up doing.
   */
  const [mounted, setMounted] = useState(open);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);

      return undefined;
    }

    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [open]);

  // Each modal owns its portal node so nothing is ever orphaned in <body>.
  useEffect(() => {
    const element = document.createElement('div');

    element.setAttribute('data-modal-portal', '');
    document.body.appendChild(element);
    setContainer(element);

    return () => {
      element.remove();
      setContainer(null);
    };
  }, []);

  // Escape closes, and the page behind the modal must not scroll.
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const { overflow } = document.body.style;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!container || !mounted) {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: EXIT_MS / 1000 }}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
    >
      <div onClick={onClose} className="fixed inset-0 bg-ink-900/35 backdrop-blur-sm" />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className={cn('neu-modal relative my-auto w-full p-6 sm:p-8', SIZES[size])}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-neu-200 text-ink-500 shadow-neu-sm transition-all hover:text-rose-500 active:shadow-neu-inset-sm"
          >
            ✕
          </button>
        )}

        {title && (
          <div className="mb-6 pr-12">
            <h2 className="font-display text-2xl font-bold text-ink-800">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
          </div>
        )}

        {children}
      </motion.div>
    </motion.div>,
    container,
  );
}
