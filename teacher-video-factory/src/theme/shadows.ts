import { Platform, type ViewStyle } from 'react-native';

const make = (elevation: number, opacity: number, radius: number, offsetY: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F5B',
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {
      boxShadow: `0 ${offsetY}px ${radius}px rgba(11,31,91,${opacity})`,
    },
  }) as ViewStyle;

export const shadows = {
  none: {} as ViewStyle,
  soft: make(2, 0.06, 12, 4),
  card: make(4, 0.08, 18, 6),
  raised: make(8, 0.14, 24, 10),
};
