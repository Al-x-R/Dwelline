import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COUNTRIES, countryCodeToFlag, type Country } from '../../constants/countries';
import { NO_ZONE } from '../../constants/zones';
import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel, useZones, zoneIdForCountry } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { BottomSheet, TextField } from '../ui';

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  // Show the "Not specified" option.
  onClear?: () => void;
  // Restrict the list to these ISO codes.
  allowedCodes?: string[];
}

export function CountryPickerSheet({visible, title, onSelect, onClose, onClear, allowedCodes}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const {allZones} = useZones();
  const zoneLabel = useZoneLabel();
  const [query, setQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);

  const filterZones = useMemo(() => allZones.filter((z) => z.isImplemented), [allZones]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES
      .map((c) => ({country: c, zoneId: zoneIdForCountry(c.code, allZones)}))
      .filter(({country, zoneId}) => {
        if (allowedCodes && !allowedCodes.includes(country.code)) return false;
        if (zoneFilter && zoneId !== zoneFilter) return false;
        if (!q) return true;
        return Object.values(country.names).some((n) => n.toLowerCase().includes(q)) || country.code.toLowerCase() === q;
      })
      .sort((a, b) => {
        // Countries from tracked zones go first.
        const at = a.zoneId === NO_ZONE ? 1 : 0;
        const bt = b.zoneId === NO_ZONE ? 1 : 0;
        if (at !== bt) return at - bt;
        return a.country.names[lang].localeCompare(b.country.names[lang], lang);
      });
  }, [query, zoneFilter, allZones, lang, allowedCodes]);

  const close = () => {
    setQuery('');
    setZoneFilter(null);
    onClose();
  };

  const select = (country: Country) => {
    onSelect(country.code);
    close();
  };

  return (
    <BottomSheet visible={visible} title={title ?? t('countryPicker.title')} onClose={close} tall>
      <TextField
        icon="search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('countryPicker.search')}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <View style={styles.chips}>
        {[null, ...filterZones.map((z) => z.id)].map((id) => {
          const zone = filterZones.find((z) => z.id === id);
          const active = zoneFilter === id;
          return (
            <Pressable
              key={id ?? 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setZoneFilter(id)}
              accessibilityRole="button"
              accessibilityState={{selected: active}}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {zone ? `${zone.flag} ${zoneLabel.short(zone)}` : t('common.all')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {onClear ? (
        <Pressable
          style={({pressed}) => [styles.row, pressed && styles.pressed]}
          onPress={() => {
            onClear();
            close();
          }}
        >
          <View style={styles.flag}>
            <Ionicons name="remove-circle-outline" size={18} color={theme.colors.textMuted}/>
          </View>
          <Text style={[styles.name, {color: theme.colors.textMuted}]}>{t('countryPicker.clear')}</Text>
        </Pressable>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.country.code}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator}/>}
        ListEmptyComponent={<Text style={styles.empty}>{t('common.nothingFound')}</Text>}
        renderItem={({item}) => {
          const zone = allZones.find((z) => z.id === item.zoneId);
          return (
            <Pressable
              style={({pressed}) => [styles.row, pressed && styles.pressed]}
              onPress={() => select(item.country)}
              accessibilityRole="button"
            >
              <View style={styles.flag}>
                <Text style={styles.flagText}>{countryCodeToFlag(item.country.code)}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>{item.country.names[lang]}</Text>
              {zone ? <Text style={styles.zoneTag}>{zone.flag} {zoneLabel.short(zone)}</Text> : null}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    chips: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.gutterSm},
    chip: {
      minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.full,
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    },
    chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
    chipText: {...typography.labelMd, color: colors.textBody},
    chipTextActive: {color: colors.onPrimary},
    list: {flex: 1},
    row: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, minHeight: 52},
    pressed: {opacity: 0.7},
    separator: {height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginLeft: 44},
    flag: {
      width: 32, height: 32, borderRadius: radius.DEFAULT, backgroundColor: colors.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
    },
    flagText: {fontSize: 20},
    name: {...typography.bodyLg, color: colors.textPrimary, flex: 1},
    zoneTag: {...typography.labelMd, color: colors.textMuted},
    empty: {...typography.bodyMd, color: colors.textMuted, textAlign: 'center', marginTop: space.lg},
  });
}
