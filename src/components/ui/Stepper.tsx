import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

interface Props {
  value: number;
  label: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accessibilityLabel: string;
}

export function Stepper({value, label, onChange, min = 0, max = Number.MAX_SAFE_INTEGER, step = 1, accessibilityLabel}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const button = (icon: 'remove' | 'add', next: number, disabled: boolean) => (
    <Pressable
      style={({pressed}) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
      onPress={() => onChange(Math.min(max, Math.max(min, next)))}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel} ${icon === 'add' ? '+' : '−'}${step}`}
    >
      <Ionicons name={icon} size={16} color={theme.colors.textPrimary}/>
    </Pressable>
  );
  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel} accessibilityValue={{text: label}}>
      {button('remove', value - step, value <= min)}
      <Text style={styles.value}>{label}</Text>
      {button('add', value + step, value >= max)}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    button: {
      width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    },
    pressed: {opacity: 0.7},
    disabled: {opacity: 0.35},
    value: {...typography.titleMd, fontSize: 14, color: colors.textPrimary, minWidth: 48, textAlign: 'center', ...tabularNums},
  });
}
