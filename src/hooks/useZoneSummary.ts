import { useMemo } from 'react';

import type { ZoneConfig } from '../constants/zones';
import { summarizeZone, type ZoneSummary } from '../core/zoneAnalytics';
import { useSettingsStore } from '../store/settingsStore';
import { useTripsStore } from '../store/tripsStore';

export function useZoneSummary(zone: ZoneConfig): ZoneSummary {
  const trips = useTripsStore((s) => s.trips);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  return useMemo(() => summarizeZone(trips, zone, buffer), [trips, zone, buffer]);
}
