import { useMemo } from 'react';

import type { ZoneConfig } from '../constants/zones';
import type { ZoneAccess } from '../core/zoneAccess';
import { summarizeZone, todayIso, type ZoneSummary } from '../core/zoneAnalytics';
import { useSettingsStore } from '../store/settingsStore';
import { useZoneContext } from './useZoneContext';

export function useZoneSummary(zone: ZoneConfig): ZoneSummary & { access: ZoneAccess } {
  const ctx = useZoneContext(zone);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  return useMemo(
    () => ({...summarizeZone(ctx.trips, zone, buffer, todayIso(), ctx.rules), access: ctx.access}),
    [ctx, zone, buffer]
  );
}
