import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel, useZones } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { useRootNavigation } from '../../navigation/types';
import { IconButton, Pill } from '../ui';
import { MenuSheet } from './MenuSheet';
import { ZoneSelectorSheet } from './ZoneSelectorSheet';

// Shared tab header: menu, zone switcher and settings.
export function AppHeader() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const navigation = useRootNavigation();
  const {selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const [zonesOpen, setZonesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      <IconButton icon="menu" onPress={() => setMenuOpen(true)} accessibilityLabel={t('header.menu')}/>
      <Pressable
        style={({pressed}) => [styles.zone, pressed && styles.pressed]}
        onPress={() => setZonesOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('header.selectZone')}: ${zoneLabel.name(selectedZone)}`}
      >
        <Text style={styles.flag}>{selectedZone.flag}</Text>
        <Text style={styles.zoneName} numberOfLines={2}>{zoneLabel.name(selectedZone)}</Text>
        <Pill label={zoneLabel.rule(selectedZone)} tone="safe" outlined/>
        <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted}/>
      </Pressable>
      <IconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} accessibilityLabel={t('header.settings')}/>

      <ZoneSelectorSheet
        visible={zonesOpen}
        onClose={() => setZonesOpen(false)}
        onAddZone={() => navigation.navigate('AddZone')}
      />
      <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)}/>
    </View>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm,
      paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.gutterSm,
    },
    zone: {
      flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.sm,
      paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border, ...elevation.card,
    },
    pressed: {opacity: 0.8},
    flag: {fontSize: 20},
    zoneName: {...typography.titleMd, fontSize: 15, lineHeight: 19, color: colors.textPrimary, flex: 1, textAlign: 'center'},
  });
}
