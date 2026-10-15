import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function IconButton({icon, onPress, accessibilityLabel, tone = 'neutral', size = 'md', disabled}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const colored = tone !== 'neutral';
  const {fg, bg} = toneColors(theme.colors, tone);
  return (
    <Pressable
      style={({pressed}) => [
        size === 'sm' ? styles.sm : styles.md,
        colored && {backgroundColor: bg, borderColor: 'transparent'},
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={colored ? fg : theme.colors.textPrimary}/>
    </Pressable>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  const base = {
    alignItems: 'center', justifyContent: 'center', borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...elevation.card,
  } as const;
  return StyleSheet.create({
    md: {...base, width: 44, height: 44},
    sm: {...base, width: 32, height: 32},
    pressed: {opacity: 0.7, transform: [{scale: 0.96}]},
    disabled: {opacity: 0.4},
  });
}
