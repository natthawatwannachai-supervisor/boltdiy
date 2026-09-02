import { THAI_MONTHS, THAI_MONTHS_SHORT } from '@/config/constants';

/** `yyyy-mm-dd` for today, in the browser's local timezone. */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Parses `yyyy-mm-dd` without the UTC shift `new Date(string)` applies. */
export function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');

  if (!match) {
    return null;
  }

  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Gregorian year -> Buddhist era. */
export const toBuddhistYear = (year: number) => year + 543;

/** `2025-03-14` -> `14 มีนาคม 2568` */
export function formatThaiDate(iso: string, opts: { short?: boolean } = {}): string {
  const date = parseISODate(iso);

  if (!date) {
    return '-';
  }

  const months = opts.short ? THAI_MONTHS_SHORT : THAI_MONTHS;

  return `${date.getDate()} ${months[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}

/** Collapses a start/end pair, dropping repeated month/year parts. */
export function formatThaiDateRange(startISO: string, endISO: string): string {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);

  if (!start) {
    return '-';
  }

  if (!end || startISO === endISO) {
    return formatThaiDate(startISO);
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()} - ${end.getDate()} ${THAI_MONTHS[end.getMonth()]} ${toBuddhistYear(
      end.getFullYear(),
    )}`;
  }

  if (sameYear) {
    return `${start.getDate()} ${THAI_MONTHS[start.getMonth()]} - ${end.getDate()} ${
      THAI_MONTHS[end.getMonth()]
    } ${toBuddhistYear(end.getFullYear())}`;
  }

  return `${formatThaiDate(startISO)} - ${formatThaiDate(endISO)}`;
}

/** `09:00` + `12:30` -> `09:00 - 12:30 น.` */
export function formatTimeRange(start: string, end: string): string {
  if (!start && !end) {
    return '-';
  }

  if (!end || start === end) {
    return `${start} น.`;
  }

  return `${start} - ${end} น.`;
}

/** `yyyy-mm` sort/query key derived from an ISO date. */
export function monthKeyOf(iso: string): string {
  return (iso || '').slice(0, 7);
}

/** `2025-03` -> `มีนาคม 2568` */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  const index = Number(month) - 1;

  if (!year || Number.isNaN(index) || index < 0 || index > 11) {
    return key;
  }

  return `${THAI_MONTHS[index]} ${toBuddhistYear(Number(year))}`;
}

/** Inclusive day count of a supervision, minimum 1. */
export function dayCount(startISO: string, endISO: string): number {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO) ?? start;

  if (!start || !end) {
    return 0;
  }

  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return Math.max(diff, 1);
}

/** Month keys present in a set of records, newest first. */
export function collectMonthKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.filter(Boolean))).sort((a, b) => b.localeCompare(a));
}

/** `2025-03-14T08:30` style stamp used in generated file names. */
export function fileStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`;
}
