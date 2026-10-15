import { useMemo } from 'react';

import type { AppTheme } from '../constants/theme';
import { useAppTheme } from './useAppTheme';

// factory must be declared at module level so styles are recreated only on theme change.
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
