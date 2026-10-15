import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  label: string;
  value: string;
  caption?: string;
  icon?: IconName;
  tone?: Tone;
  captionTone?: Tone;
}

export function StatTile({label, value, caption, icon, tone = 'primary', captionTone}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {fg, bg} = toneColors(theme.colors, tone);
  return (
    <View style={styles.tile}>
      <View style={styles.top}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        {icon ? (
          <View style={[styles.icon, {backgroundColor: bg}]}>
            <Ionicons name={icon} size={16} color={fg}/>
          </View>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={2}>{value}</Text>
      {caption ? (
        <Text
          style={[styles.caption, captionTone && {color: toneColors(theme.colors, captionTone).fg}]}
          numberOfLines={2}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    tile: {
      flex: 1, minHeight: 150, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between', gap: space.sm, ...elevation.card,
    },
    top: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm},
    label: {...typography.bodyMd, color: colors.textMuted, flex: 1},
    icon: {width: 30, height: 30, borderRadius: radius.DEFAULT, alignItems: 'center', justifyContent: 'center'},
    value: {...typography.headlineMd, color: colors.textPrimary, ...tabularNums},
    caption: {...typography.bodySm, color: colors.textMuted},
  });
}
