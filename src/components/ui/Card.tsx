import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { toneColors } from './tone';
import type { Tone } from './types';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'dashed' | 'inset';
  // Highlight the border with a status color.
  tone?: Tone;
  padded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({children, variant = 'default', tone, padded = true, onPress, accessibilityLabel, style}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const toneStyle = tone && tone !== 'neutral' ? {borderColor: withAlpha(toneColors(theme.colors, tone).fg, 0.35)} : null;
  const base = [styles.card, styles[variant], padded && styles.padded, toneStyle, style];

  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      style={({pressed}) => [...base, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

// '#RRGGBB' → rgba; other formats are returned as is.
export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    card: {borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border},
    padded: {padding: space.md},
    default: {backgroundColor: colors.surface, ...elevation.card},
    elevated: {backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong},
    dashed: {borderStyle: 'dashed', borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: 'transparent'},
    inset: {backgroundColor: colors.surfaceElevated, borderColor: 'transparent', borderRadius: radius.md},
    pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
  });
}
