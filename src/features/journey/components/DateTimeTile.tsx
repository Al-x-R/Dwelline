import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { IconName } from '../../../components/ui';

interface Props {
  label: string;
  icon: IconName;
  date: string | null; // already formatted
  time?: string | null;
  datePlaceholder: string;
  timePlaceholder: string;
  onPressDate?: () => void;
  onPressTime?: () => void;
  accent?: 'safe' | 'warning';
}

// Arrival / Departure tile: date and time are tappable separately.
export function DateTimeTile({
  label, icon, date, time, datePlaceholder, timePlaceholder, onPressDate, onPressTime, accent = 'safe',
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const iconColor = accent === 'safe' ? theme.colors.safe : theme.colors.warning;
  return (
    <View style={styles.tile}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.values}>
        <Ionicons name={icon} size={16} color={iconColor}/>
        <Pressable
          onPress={onPressDate}
          disabled={!onPressDate}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${date ?? datePlaceholder}`}
        >
          <Text style={[styles.value, !date && styles.placeholder]}>{date ?? datePlaceholder}</Text>
        </Pressable>
        {onPressTime ? (
          <Pressable
            onPress={onPressTime}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${time ?? timePlaceholder}`}
          >
            <Text style={[styles.time, !time && styles.placeholder]}>{time || timePlaceholder}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    tile: {flex: 1, padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, gap: space.sm},
    label: {...typography.labelCaps, color: colors.textMuted},
    values: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xs + 2},
    value: {...typography.titleMd, fontSize: 14, color: colors.textPrimary, ...tabularNums},
    time: {...typography.titleMd, fontSize: 14, fontFamily: fonts.bold, color: colors.accentText, ...tabularNums},
    placeholder: {color: colors.textMuted, fontFamily: fonts.regular},
  });
}
