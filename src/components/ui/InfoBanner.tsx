import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { withAlpha } from './Card';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  icon: IconName;
  tone?: Tone;
  title?: string;
  text: React.ReactNode;
  compact?: boolean;
}

// Explanatory banner: engine status, hint or warning.
export function InfoBanner({icon, tone = 'neutral', title, text, compact}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {fg, bg} = toneColors(theme.colors, tone);
  return (
    <View
      style={[
        styles.box,
        compact && styles.compact,
        tone !== 'neutral' && {borderColor: withAlpha(fg, 0.3)},
      ]}
    >
      <View style={[styles.icon, compact && styles.iconCompact, {backgroundColor: bg}]}>
        <Ionicons name={icon} size={compact ? 16 : 20} color={fg}/>
      </View>
      <View style={styles.body}>
        {title ? <Text style={[styles.title, {color: fg}]}>{title}</Text> : null}
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    box: {
      flexDirection: 'row', gap: space.gutterSm, padding: space.md, borderRadius: radius.lg,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    compact: {padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center'},
    icon: {width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center'},
    iconCompact: {width: 32, height: 32, borderRadius: radius.full},
    body: {flex: 1},
    title: {...typography.labelCaps, marginBottom: 2},
    text: {...typography.bodyMd, color: colors.textBody},
  });
}
