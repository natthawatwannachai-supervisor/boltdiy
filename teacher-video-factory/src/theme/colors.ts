/**
 * โทนสีหลักของแอป: น้ำเงินเข้ม + ฟ้า + ขาว และแต้มม่วง "AI" เล็กน้อย
 * ใช้ gradient เฉพาะจุดที่ต้องการเน้น (ปุ่มหลัก, การ์ด AI, header) เท่านั้น
 */
export const palette = {
  navy900: '#071539',
  navy800: '#0B1F5B',
  navy700: '#12307E',
  blue600: '#1D4ED8',
  blue500: '#2563EB',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',
  sky500: '#0EA5E9',
  sky400: '#38BDF8',
  sky100: '#E0F2FE',
  violet600: '#7C3AED',
  violet500: '#8B5CF6',
  violet100: '#EDE9FE',
  green600: '#059669',
  green100: '#D1FAE5',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  red600: '#DC2626',
  red100: '#FEE2E2',
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray900: '#0F172A',
} as const;

export const colors = {
  /** พื้นหลังหลักของหน้าจอ */
  background: palette.gray50,
  surface: palette.white,
  surfaceMuted: palette.gray100,
  border: palette.gray200,
  borderStrong: palette.gray300,

  primary: palette.blue600,
  primaryDark: palette.navy800,
  primarySoft: palette.blue50,
  onPrimary: palette.white,

  accent: palette.violet600,
  accentSoft: palette.violet100,

  info: palette.sky500,
  infoSoft: palette.sky100,

  success: palette.green600,
  successSoft: palette.green100,
  warning: palette.amber500,
  warningSoft: palette.amber100,
  danger: palette.red600,
  dangerSoft: palette.red100,

  text: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textOnDark: palette.white,
  textOnDarkMuted: 'rgba(255,255,255,0.72)',

  overlay: 'rgba(7,21,57,0.55)',
} as const;

export const gradients = {
  /** ใช้กับ header หลักและปุ่ม CTA ใหญ่ */
  brand: [palette.navy800, palette.blue600] as const,
  /** ใช้กับองค์ประกอบที่สื่อถึง AI */
  ai: [palette.blue600, palette.violet600] as const,
  sky: [palette.blue500, palette.sky400] as const,
  success: ['#047857', palette.green600] as const,
  premium: ['#7C3AED', '#DB2777'] as const,
  dark: [palette.navy900, palette.navy700] as const,
};
