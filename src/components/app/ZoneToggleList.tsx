import React from 'react';
import { View } from 'react-native';

import { resolveZoneAccess } from '../../core/zoneAccess';
import { useTravelDocuments } from '../../hooks/useZoneContext';
import { useZoneLabel, useZones } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { useIsPro } from '../../store/proStore';
import { useZonesStore } from '../../store/zonesStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ListRow, Toggle } from '../ui';

interface Props {
  // Opens the paywall; the free-tier note is shown only when it's given.
  onUpgrade?: () => void;
}

// Zone list with "track" toggles. At least one zone always stays enabled; without Pro, exactly one.
export function ZoneToggleList({onUpgrade}: Props) {
  const {t} = useT();
  const {allZones} = useZones();
  const zoneLabel = useZoneLabel();
  const docs = useTravelDocuments();
  const activeZoneIds = useZonesStore((s) => s.activeZoneIds);
  const setActiveZoneIds = useZonesStore((s) => s.setActiveZoneIds);
  const selectedZoneId = useSettingsStore((s) => s.selectedZoneId);
  const setSelectedZoneId = useSettingsStore((s) => s.setSelectedZoneId);

  const isPro = useIsPro();

  const toggle = (id: string, on: boolean) => {
    if (!isPro) {
      // One zone at a time: turning another on switches to it, the only one can't be turned off.
      if (!on) return;
      setActiveZoneIds([id]);
      setSelectedZoneId(id);
      return;
    }
    const next = on ? [...activeZoneIds, id] : activeZoneIds.filter((z) => z !== id);
    if (next.length === 0) return;
    setActiveZoneIds(next);
    if (!on && id === selectedZoneId) setSelectedZoneId(next[0]);
  };

  return (
    <View>
      {!isPro && onUpgrade ? (
        <ListRow
          icon="diamond-outline"
          iconTone="warning"
          title={t('zoneSheet.freeLimit')}
          value={t('pro.badge')}
          onPress={onUpgrade}
        />
      ) : null}
      {allZones.map((zone, i) => {
        const active = isPro ? activeZoneIds.includes(zone.id) : activeZoneIds[0] === zone.id;
        const free = resolveZoneAccess(zone, docs).mode === 'free';
        const subtitle = free
          ? t('zoneSheet.freeForYou')
          : `${zoneLabel.rule(zone)}${zone.isImplemented ? '' : ` • ${t('zoneSheet.unverified')}`}`;
        return (
          <ListRow
            key={zone.id}
            title={`${zone.flag}  ${zoneLabel.name(zone)}`}
            subtitle={subtitle}
            trailing={
              <Toggle value={active} onValueChange={(on) => toggle(zone.id, on)} accessibilityLabel={zoneLabel.name(zone)}/>
            }
            last={i === allZones.length - 1}
          />
        );
      })}
    </View>
  );
}
