import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  icon?: IconName;
  iconTone?: Tone;
  title: string;
  subtitle?: string;
  value?: string;
  // Arbitrary trailing element (Toggle, Stepper, Pill…). Overrides value/chevron.
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  external?: boolean;
  destructive?: boolean;
  last?: boolean;
}

// Settings list row: icon in a tile, title, subtitle and trailing slot.
export function ListRow({
  icon, iconTone = 'neutral', title, subtitle, value, trailing, onPress, chevron, external, destructive, last,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {fg, bg} = toneColors(theme.colors, destructive ? 'danger' : iconTone);
  const showChevron = chevron ?? (!!onPress && !trailing);

  const body = (
    <>
      {icon ? (
        <View style={[styles.iconBox, {backgroundColor: bg}]}>
          <Ionicons name={icon} size={18} color={fg}/>
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, destructive && {color: theme.colors.danger}]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (
        <View style={styles.trailing}>
          {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
          {external ? <Ionicons name="open-outline" size={16} color={theme.colors.textMuted}/> : null}
          {showChevron && !external ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted}/> : null}
        </View>
      )}
    </>
  );

  const rowStyle = [styles.row, !last && styles.divider];
  if (!onPress) return <View style={rowStyle}>{body}</View>;
  return (
    <Pressable
      style={({pressed}) => [...rowStyle, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
    >
      {body}
    </Pressable>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, minHeight: 60, paddingVertical: space.gutterSm},
    divider: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong},
    pressed: {opacity: 0.7},
    iconBox: {width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center'},
    text: {flex: 1},
    title: {...typography.titleMd, fontSize: 15, color: colors.textPrimary},
    subtitle: {...typography.bodySm, color: colors.textMuted, marginTop: 2},
    trailing: {flexDirection: 'row', alignItems: 'center', gap: space.xs, maxWidth: '45%'},
    value: {...typography.bodyMd, color: colors.textBody, flexShrink: 1},
  });
}
