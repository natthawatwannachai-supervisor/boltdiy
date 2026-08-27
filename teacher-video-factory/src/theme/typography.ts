import { Platform, type TextStyle } from 'react-native';

/**
 * ฟอนต์ระบบรองรับภาษาไทยได้ดีทั้งสองแพลตฟอร์ม
 * (iOS ใช้ Thonburi/SF, Android ใช้ Noto Sans Thai)
 */
const family = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const familyMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' });

type Variant = TextStyle;

export const typography: Record<
  'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'button',
  Variant
> = {
  display: { fontFamily: familyMedium, fontSize: 30, lineHeight: 42, fontWeight: '700' },
  h1: { fontFamily: familyMedium, fontSize: 24, lineHeight: 36, fontWeight: '700' },
  h2: { fontFamily: familyMedium, fontSize: 20, lineHeight: 30, fontWeight: '700' },
  h3: { fontFamily: familyMedium, fontSize: 17, lineHeight: 26, fontWeight: '600' },
  body: { fontFamily: family, fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: familyMedium, fontSize: 15, lineHeight: 24, fontWeight: '600' },
  small: { fontFamily: family, fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: family, fontSize: 11, lineHeight: 16 },
  button: { fontFamily: familyMedium, fontSize: 16, lineHeight: 22, fontWeight: '600' },
};
