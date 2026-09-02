import type { CategoryStat, MonthlyStat, SupervisionRecord } from '@/types';
import { dayCount, formatMonthKey } from '@/utils/date';

/** Per-month totals, oldest first so charts read left-to-right. */
export function monthlyStats(records: SupervisionRecord[]): MonthlyStat[] {
  const buckets = new Map<string, MonthlyStat>();

  records.forEach((record) => {
    const key = record.monthKey || record.startDate.slice(0, 7);
    const entry = buckets.get(key) ?? {
      key,
      label: formatMonthKey(key),
      total: 0,
      images: 0,
      days: 0,
    };

    entry.total += 1;
    entry.images += record.images?.length ?? 0;
    entry.days += dayCount(record.startDate, record.endDate);
    buckets.set(key, entry);
  });

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Record counts per supervision task, largest first. */
export function categoryStats(records: SupervisionRecord[]): CategoryStat[] {
  const buckets = new Map<string, number>();

  records.forEach((record) => {
    const key = record.category || 'อื่น ๆ';

    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return [...buckets.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface Totals {
  records: number;
  days: number;
  images: number;
  locations: number;
}

export function totalsOf(records: SupervisionRecord[]): Totals {
  return {
    records: records.length,
    days: records.reduce((sum, record) => sum + dayCount(record.startDate, record.endDate), 0),
    images: records.reduce((sum, record) => sum + (record.images?.length ?? 0), 0),
    locations: new Set(records.map((record) => record.location.trim()).filter(Boolean)).size,
  };
}

/** Chronological sort used by every table in the app (newest supervision first). */
export function sortByDateDesc(records: SupervisionRecord[]): SupervisionRecord[] {
  return [...records].sort(
    (a, b) => b.startDate.localeCompare(a.startDate) || b.startTime.localeCompare(a.startTime),
  );
}
