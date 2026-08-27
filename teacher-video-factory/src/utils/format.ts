/** ฟังก์ชันจัดรูปแบบข้อความภาษาไทยที่ใช้ซ้ำหลายหน้าจอ */

export const formatTHB = (amount: number) =>
  `${amount.toLocaleString('th-TH')} บาท`;

export const formatNumber = (value: number) => value.toLocaleString('th-TH');

/** 125 วินาที -> "02:05" */
export const formatTimecode = (totalSeconds: number) => {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(safe / 60).toString().padStart(2, '0');
  const ss = (safe % 60).toString().padStart(2, '0');

  return `${mm}:${ss}`;
};

export const formatSceneRange = (startSec: number, endSec: number) =>
  `${formatTimecode(startSec)}–${formatTimecode(endSec)}`;

const RELATIVE_UNITS: [number, string][] = [
  [60, 'วินาที'],
  [60, 'นาที'],
  [24, 'ชั่วโมง'],
  [7, 'วัน'],
];

/** "3 นาทีที่แล้ว" / "เมื่อสักครู่" */
export const formatRelativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();

  if (Number.isNaN(diffMs)) {
    return '';
  }

  if (diffMs < 60_000) {
    return 'เมื่อสักครู่';
  }

  let value = diffMs / 1000;
  let unit = 'วินาที';

  for (const [step, nextUnit] of RELATIVE_UNITS) {
    if (value < step) {
      break;
    }

    value /= step;
    unit = nextUnit;
  }

  if (unit === 'วัน' && value >= 4) {
    return formatThaiDate(iso);
  }

  return `${Math.floor(value)} ${unit}ที่แล้ว`;
};

export const formatThaiDate = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDuration = (minutes: number) => `${minutes} นาที`;

export const initialsOf = (first?: string | null, last?: string | null) =>
  `${first?.trim().charAt(0) ?? ''}${last?.trim().charAt(0) ?? ''}`.trim() || 'ค';
