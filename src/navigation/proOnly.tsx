import React, { useEffect, type ComponentType } from 'react';

import { useIsPro } from '../store/proStore';
import { useRootNavigation } from './types';

// Route-level guard for Pro screens: entry points already open the paywall, this catches any other way in.
export function proOnly<P extends object>(Screen: ComponentType<P>): ComponentType<P> {
  function ProOnlyScreen(props: P) {
    const isPro = useIsPro();
    const navigation = useRootNavigation();
    useEffect(() => {
      if (!isPro) navigation.replace('Plans');
    }, [isPro, navigation]);
    return isPro ? <Screen {...props}/> : null;
  }
  ProOnlyScreen.displayName = `ProOnly(${Screen.displayName ?? Screen.name})`;
  return ProOnlyScreen;
}
