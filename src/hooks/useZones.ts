import { useCallback, useMemo } from 'react';

import { BUILT_IN_ZONES, NO_ZONE, type ZoneConfig } from '../constants/zones';
import type { StayRules } from '../core/schengenCalculator';
import { useT, type TranslationKey } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { useZonesStore } from '../store/zonesStore';
import { stayRuleLabel, zoneName, zoneRuleLabel } from '../utils/zoneLabels';
import { useTravelDocuments } from './useZoneContext';

// Zones whose full name is too long for chips and pills.
const SHORT_NAME_IDS = new Set(['schengen', 'north_macedonia', 'bosnia', 'south_korea']);

export function zoneIdForCountry(code: string, zones: ZoneConfig[]): string {
  // Custom zones take precedence over built-in ones — they were created explicitly.
  const custom = zones.find((z) => z.isCustom && z.countryCodes.includes(code));
  if (custom) return custom.id;
  return zones.find((z) => z.countryCodes.includes(code))?.id ?? NO_ZONE;
}

export function useZones() {
  const customZones = useZonesStore((s) => s.customZones);
  const activeZoneIds = useZonesStore((s) => s.activeZoneIds);
  const selectedZoneId = useSettingsStore((s) => s.selectedZoneId);

  return useMemo(() => {
    const allZones = [...BUILT_IN_ZONES, ...customZones];
    const activeZones = activeZoneIds
      .map((id) => allZones.find((z) => z.id === id))
      .filter((z): z is ZoneConfig => !!z);
    const selectedZone =
      allZones.find((z) => z.id === selectedZoneId) ?? activeZones[0] ?? BUILT_IN_ZONES[0];
    return {allZones, activeZones, selectedZone};
  }, [customZones, activeZoneIds, selectedZoneId]);
}

export function useZoneLabel() {
  const {t, lang} = useT();
  const name = useCallback((zone: ZoneConfig | undefined | null): string => zoneName(zone, lang), [lang]);
  const short = useCallback(
    (zone: ZoneConfig | undefined | null): string =>
      zone && !zone.isCustom && SHORT_NAME_IDS.has(zone.id) ? t(`zoneShort.${zone.id}` as TranslationKey) : name(zone),
    [name, t]
  );
  const docs = useTravelDocuments();
  const formatRule = useCallback((r: StayRules): string => stayRuleLabel(r, lang), [lang]);
  const rule = useCallback((zone: ZoneConfig | undefined | null): string => zoneRuleLabel(zone, docs, lang), [docs, lang]);
  // "Limited by the 90/180 rule" when an extra rule is stricter than the main one right now.
  const limitedBy = useCallback(
    (r: StayRules | null | undefined): string | null => (r ? t('zone.limitedBy', {rule: formatRule(r)}) : null),
    [t, formatRule]
  );
  return {name, short, rule, formatRule, limitedBy};
}
