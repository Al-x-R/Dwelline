import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel, useZones } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useIsPro } from '../../store/proStore';
import { useZonesStore } from '../../store/zonesStore';
import { BottomSheet, Pill } from '../ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddZone: () => void;
}

export function ZoneSelectorSheet({visible, onClose, onAddZone}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const {allZones, selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const setSelectedZoneId = useSettingsStore((s) => s.setSelectedZoneId);
  const activeZoneIds = useZonesStore((s) => s.activeZoneIds);
  const setActiveZoneIds = useZonesStore((s) => s.setActiveZoneIds);

  const isPro = useIsPro();

  // Free tier tracks one zone: picking another one switches to it.
  const select = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    if (!isPro) await setActiveZoneIds([zoneId]);
    else if (!activeZoneIds.includes(zoneId)) await setActiveZoneIds([...activeZoneIds, zoneId]);
    onClose();
  };

  return (
    <BottomSheet visible={visible} title={t('zoneSheet.title')} subtitle={t('zoneSheet.subtitle')} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {allZones.map((zone) => {
          const active = zone.id === selectedZone.id;
          return (
            <Pressable
              key={zone.id}
              style={({pressed}) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
              onPress={() => select(zone.id)}
              accessibilityRole="radio"
              accessibilityState={{selected: active}}
            >
              <Text style={styles.flag}>{zone.flag}</Text>
              <View style={styles.text}>
                <Text style={styles.name}>{zoneLabel.name(zone)}</Text>
                <Text style={styles.caption}>
                  {zone.isCustom ? t('zoneSheet.custom') : !zone.isImplemented ? t('zoneSheet.unverified') : ''}
                </Text>
              </View>
              <Pill label={zoneLabel.rule(zone)} tone={active ? 'safe' : 'neutral'} outlined={active}/>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? theme.colors.safe : theme.colors.textMuted}
              />
            </Pressable>
          );
        })}
        <Pressable
          style={({pressed}) => [styles.addRow, pressed && styles.pressed]}
          onPress={() => {
            onClose();
            onAddZone();
          }}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.accentText}/>
          <Text style={styles.addText}>{t('zoneSheet.addCustom')}</Text>
          {!isPro ? <Pill label={t('pro.badge')} tone="warning" caps/> : null}
        </Pressable>
        {!isPro ? <Text style={styles.freeNote}>{t('zoneSheet.freeLimit')}</Text> : null}
      </ScrollView>
    </BottomSheet>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, minHeight: 60,
      paddingHorizontal: space.gutterSm, borderRadius: radius.lg, marginBottom: space.xs,
    },
    rowActive: {backgroundColor: colors.surfaceElevated},
    pressed: {opacity: 0.7},
    flag: {fontSize: 26},
    text: {flex: 1},
    name: {...typography.titleMd, color: colors.textPrimary},
    caption: {...typography.bodySm, color: colors.textMuted},
    addRow: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 56, marginTop: space.sm,
      paddingHorizontal: space.gutterSm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    addText: {...typography.titleMd, flex: 1, color: colors.accentText},
    freeNote: {...typography.bodySm, color: colors.textMuted, paddingHorizontal: space.gutterSm, paddingBottom: space.sm},
  });
}
