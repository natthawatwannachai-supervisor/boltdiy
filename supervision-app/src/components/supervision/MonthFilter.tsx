import { motion } from 'framer-motion';
import { formatMonthKey } from '@/utils/date';
import { cn } from '@/utils/cn';

interface MonthFilterProps {
  months: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/** Dropdown filter over the month keys present in the loaded records. */
export function MonthFilter({
  months,
  value,
  onChange,
  label = 'กรองตามเดือน',
  className,
}: MonthFilterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('min-w-[13rem]', className)}
    >
      <label className="neu-label" htmlFor="month-filter">
        {label}
      </label>
      <div className="relative">
        <select
          id="month-filter"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="neu-input appearance-none pr-11"
        >
          <option value="all">ทุกเดือน</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthKey(month)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
          ▾
        </span>
      </div>
    </motion.div>
  );
}
