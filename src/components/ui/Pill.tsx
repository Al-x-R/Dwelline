import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { withAlpha } from './Card';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  label: string;
  tone?: Tone;
  // Glowing indicator dot on the left.
  orb?: boolean;
  icon?: IconName;
  outlined?: boolean;
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Pill({label, tone = 'neutral', orb = false, icon, outlined = false, caps = false, style}: Props) {
  const theme = useAppTheme();
  const {fg, bg} = toneColors(theme.colors, tone);
  return (
    <View
      style={[
        styles.pill,
        {backgroundColor: bg},
        outlined && {borderWidth: 1, borderColor: withAlpha(fg, 0.4)},
        style,
      ]}
    >
      {orb ? <View style={[styles.orb, {backgroundColor: fg, boxShadow: `0 0 6px ${fg}`}]}/> : null}
      {icon ? <Ionicons name={icon} size={12} color={fg}/> : null}
      <Text style={[caps ? styles.caps : styles.text, {color: fg}]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: space.xs + 2,
    paddingHorizontal: 10, paddingVertical: space.xs, borderRadius: radius.full,
  },
  orb: {width: 6, height: 6, borderRadius: radius.full},
  text: {...typography.labelMd, ...tabularNums},
  caps: {...typography.labelCaps, ...tabularNums},
});
