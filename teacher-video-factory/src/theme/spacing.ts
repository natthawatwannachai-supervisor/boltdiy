export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

/** ความสูงขั้นต่ำของ target ที่กดได้ เพื่อให้ครูกดง่ายบนมือถือ */
export const hitSize = {
  min: 48,
  button: 52,
  buttonLarge: 60,
} as const;
