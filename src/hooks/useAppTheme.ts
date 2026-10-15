import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from '../constants/theme';

// The user choice (light/dark/system) is applied via Appearance.setColorScheme,
// so the system hook already returns the resulting scheme.
export function useAppTheme(): AppTheme {
  return useColorScheme() === 'light' ? lightTheme : darkTheme;
}
