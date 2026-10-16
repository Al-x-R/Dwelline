import { useMemo } from 'react';

import type { ZoneConfig } from '../constants/zones';
import { zoneContext, type TravelDocuments, type ZoneContext } from '../core/zoneAccess';
import { useSettingsStore } from '../store/settingsStore';
import { useTripsStore } from '../store/tripsStore';

export function useTravelDocuments(): TravelDocuments {
  const passports = useSettingsStore((s) => s.passports);
  const residences = useSettingsStore((s) => s.residences);
  return useMemo(() => ({passports, residences}), [passports, residences]);
}

export function useZoneContext(zone: ZoneConfig): ZoneContext {
  const trips = useTripsStore((s) => s.trips);
  const docs = useTravelDocuments();
  return useMemo(() => zoneContext(zone, trips, docs), [zone, trips, docs]);
}
