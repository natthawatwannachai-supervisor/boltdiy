import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'neu' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  neu: 'btn-neu',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(function NeuButton(
  { variant = 'primary', loading = false, icon, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      disabled={disabled || loading}
      className={cn(VARIANTS[variant], fullWidth && 'w-full', className)}
      {...(rest as Record<string, unknown>)}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
});
