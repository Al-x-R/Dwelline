import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import type { IconName } from './types';

export interface SegmentOption<T extends string> {
  value: T;
  label?: string;
  icon?: IconName;
  accessibilityLabel?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  // Tapping the selected segment again clears the selection.
  allowDeselect?: boolean;
  onDeselect?: () => void;
}

export function SegmentedControl<T extends string>({options, value, onChange, allowDeselect, onDeselect}: Props<T>) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const active = opt.value === value;
        const color = active ? theme.colors.onPrimary : theme.colors.textMuted;
        return (
          <Pressable
            key={opt.value}
            style={({pressed}) => [styles.segment, active && styles.active, pressed && !active && styles.pressed]}
            onPress={() => (active && allowDeselect ? onDeselect?.() : onChange(opt.value))}
            accessibilityRole="radio"
            accessibilityState={{selected: active}}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
          >
            {opt.icon ? <Ionicons name={opt.icon} size={18} color={color}/> : null}
            {opt.label ? (
              <Text style={[styles.label, {color: active ? theme.colors.onPrimary : theme.colors.textBody}]} numberOfLines={1}>
                {opt.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row', gap: space.xs, padding: space.xs, borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    },
    segment: {
      flex: 1, minHeight: 40, flexDirection: 'row', gap: space.xs, alignItems: 'center', justifyContent: 'center',
      borderRadius: radius.DEFAULT, paddingHorizontal: space.xs,
    },
    active: {backgroundColor: colors.primary, ...elevation.interactive},
    pressed: {opacity: 0.7},
    label: {...typography.labelMd, fontSize: 13},
  });
}
