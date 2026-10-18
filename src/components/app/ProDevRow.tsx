import React from 'react';

import { useProStore } from '../../store/proStore';
import { ListRow, Toggle } from '../ui';

// Dev only: switch between the free and Pro tiers without a purchase.
export function ProDevRow() {
  const devMode = useProStore((s) => s.devMode);
  const setDevMode = useProStore((s) => s.setDevMode);
  return (
    <ListRow
      icon="diamond-outline"
      iconTone="warning"
      title="Pro"
      subtitle={devMode === 'pro' ? 'Все функции открыты' : 'Бесплатный тариф'}
      trailing={<Toggle value={devMode === 'pro'} onValueChange={(on) => setDevMode(on ? 'pro' : 'free')} accessibilityLabel="Pro"/>}
    />
  );
}
