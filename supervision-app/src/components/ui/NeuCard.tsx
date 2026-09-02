import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

type Variant = 'raised' | 'inset' | 'flat';

const VARIANTS: Record<Variant, string> = {
  raised: 'shadow-neu',
  inset: 'shadow-neu-inset',
  flat: 'shadow-neu-sm',
};

interface NeuCardProps extends HTMLMotionProps<'div'> {
  variant?: Variant;
  /** Lifts the card on hover — use for interactive cards only. */
  hoverable?: boolean;
}

export function NeuCard({
  variant = 'raised',
  hoverable = false,
  className,
  children,
  ...rest
}: NeuCardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -6, transition: { type: 'spring', stiffness: 300 } } : undefined}
      className={cn(
        'rounded-neu bg-neu-200',
        VARIANTS[variant],
        hoverable && 'cursor-pointer transition-shadow duration-300 hover:shadow-neu-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
