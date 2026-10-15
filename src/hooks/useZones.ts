import { useCallback, useMemo } from 'react';

import { BUILT_IN_ZONES, NO_ZONE, type ZoneConfig } from '../constants/zones';
import { useT, type TranslationKey } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { useZonesStore } from '../store/zonesStore';

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
  const {t} = useT();
  const name = useCallback(
    (zone: ZoneConfig | undefined | null): string => {
      if (!zone) return t('zone.none');
      if (zone.isCustom) return zone.name;
      return t(`zone.${zone.id}` as TranslationKey);
    },
    [t]
  );
  const short = useCallback(
    (zone: ZoneConfig | undefined | null): string =>
      zone?.id === 'schengen' ? t('zoneShort.schengen') : name(zone),
    [name, t]
  );
  const rule = useCallback(
    (zone: ZoneConfig | undefined | null): string =>
      zone?.ruleType === 'per_visit'
        ? t('zone.rulePerVisit', {max: zone.maxStayDays ?? 90})
        : t('zone.rule', {max: zone?.maxStayDays ?? 90, window: zone?.windowSizeDays ?? 180}),
    [t]
  );
  return {name, short, rule};
}
