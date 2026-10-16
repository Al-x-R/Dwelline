import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import type { ZoneConfig } from '../../constants/zones';
import { COUNTRIES } from '../../constants/countries';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel, useZones } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { BottomSheet, Pill, TextField } from '../ui';

interface Props {
  visible: boolean;
  value: string;
  onSelect: (zoneId: string) => void;
  onClose: () => void;
}

// Pick any zone (tracked first, then the rest) without changing the app-wide zone or tracking it.
export function ZonePickerSheet({visible, value, onSelect, onClose}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const {allZones, activeZones} = useZones();
  const zoneLabel = useZoneLabel();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A zone matches by its own name or by the name of any of its countries ("Prague" won't, "Czechia" will).
    const matches = (zone: ZoneConfig) =>
      !q ||
      zoneLabel.name(zone).toLowerCase().includes(q) ||
      zone.countryCodes.some((code) =>
        Object.values(COUNTRIES.find((c) => c.code === code)?.names ?? {}).some((n) => n.toLowerCase().includes(q))
      );
    const tracked = new Set(activeZones.map((z) => z.id));
    const byName = (a: ZoneConfig, b: ZoneConfig) => zoneLabel.name(a).localeCompare(zoneLabel.name(b));
    return [
      {key: 'tracked', title: t('zonePicker.tracked'), data: activeZones.filter(matches)},
      {key: 'other', title: t('zonePicker.other'), data: allZones.filter((z) => !tracked.has(z.id) && matches(z)).sort(byName)},
    ].filter((s) => s.data.length > 0);
  }, [query, allZones, activeZones, zoneLabel, t]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} title={t('zonePicker.title')} onClose={close} tall>
      <TextField
        icon="search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('zonePicker.search')}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={(z) => z.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({section}) => <Text style={styles.section}>{section.title}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator}/>}
        ListEmptyComponent={<Text style={styles.empty}>{t('common.nothingFound')}</Text>}
        renderItem={({item: zone}) => {
          const active = zone.id === value;
          return (
            <Pressable
              style={({pressed}) => [styles.row, pressed && styles.pressed]}
              onPress={() => {
                onSelect(zone.id);
                close();
              }}
              accessibilityRole="radio"
              accessibilityState={{selected: active}}
            >
              <Text style={styles.flag}>{zone.flag}</Text>
              <Text style={styles.name} numberOfLines={1}>{zoneLabel.name(zone)}</Text>
              <Pill label={zoneLabel.rule(zone)} tone={active ? 'safe' : 'neutral'} outlined={active}/>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? theme.colors.safe : theme.colors.textMuted}
              />
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    list: {flex: 1, marginTop: space.sm},
    section: {...typography.labelCaps, color: colors.textMuted, marginTop: space.md, marginBottom: space.xs},
    row: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, minHeight: 52, borderRadius: radius.md},
    pressed: {opacity: 0.7},
    flag: {fontSize: 22, width: 28, textAlign: 'center'},
    name: {...typography.titleMd, color: colors.textPrimary, flex: 1},
    separator: {height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginLeft: 40},
    empty: {...typography.bodyMd, color: colors.textMuted, textAlign: 'center', marginTop: space.lg},
  });
}
