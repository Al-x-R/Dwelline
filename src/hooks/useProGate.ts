import { useCallback } from 'react';

import { useRootNavigation } from '../navigation/types';
import { useIsPro } from '../store/proStore';

// Runs a Pro action, or opens the paywall instead.
export function useProGate() {
  const isPro = useIsPro();
  const navigation = useRootNavigation();
  const requirePro = useCallback(
    (action: () => void) => {
      if (isPro) action();
      else navigation.navigate('Plans');
    },
    [isPro, navigation]
  );
  return {isPro, requirePro};
}
