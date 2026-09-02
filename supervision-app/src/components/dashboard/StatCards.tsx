import { motion } from 'framer-motion';
import { NeuCard } from '@/components/ui/NeuCard';
import { staggerContainer, staggerItem } from '@/components/ui/Reveal';
import type { Totals } from '@/utils/stats';

const CARDS = [
  { key: 'records', label: 'ครั้งที่นิเทศ', icon: '📝', suffix: 'ครั้ง' },
  { key: 'days', label: 'รวมวันนิเทศ', icon: '📆', suffix: 'วัน' },
  { key: 'locations', label: 'สถานที่นิเทศ', icon: '🏫', suffix: 'แห่ง' },
  { key: 'images', label: 'ภาพประกอบ', icon: '📷', suffix: 'ภาพ' },
] as const;

export function StatCards({ totals }: { totals: Totals }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {CARDS.map((card) => (
        <motion.div key={card.key} variants={staggerItem}>
          <NeuCard className="p-5">
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neu-200 text-xl shadow-neu-sm">
                {card.icon}
              </span>
              <span className="text-xs font-medium text-ink-400">{card.suffix}</span>
            </div>

            <p className="mt-4 font-display text-3xl font-bold text-gradient tabular-nums">
              {totals[card.key]}
            </p>
            <p className="text-sm text-ink-500">{card.label}</p>
          </NeuCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
