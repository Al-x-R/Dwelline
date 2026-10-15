import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import type { IconName } from './types';

export type ButtonVariant = 'primary' | 'safe' | 'danger' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  size?: 'md' | 'lg';
  disabled?: boolean;
  busy?: boolean;
  // Pill instead of a rectangle — for floating CTAs.
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  size = 'lg',
  disabled = false,
  busy = false,
  pill = false,
  style,
  accessibilityLabel,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || busy;

  const gradient =
    variant === 'primary' ? theme.gradients.primary
      : variant === 'safe' ? theme.gradients.safe
        : variant === 'danger' ? theme.gradients.danger
          : null;

  const fg = inactive
    ? theme.colors.onDisabled
    : variant === 'primary' ? theme.colors.onPrimary
      : variant === 'safe' ? theme.colors.onSafe
        : variant === 'danger' ? theme.colors.onDanger
          : variant === 'ghost' ? theme.colors.accentText
            : theme.colors.textPrimary;

  const iconEl = busy ? (
    <ActivityIndicator size="small" color={fg}/>
  ) : icon ? (
    <Ionicons name={icon} size={20} color={fg}/>
  ) : null;

  const content = (
    <View style={[styles.content, size === 'md' ? styles.md : styles.lg]}>
      {iconPosition === 'left' ? iconEl : null}
      <Text style={[styles.label, {color: fg}]} numberOfLines={1}>{label}</Text>
      {iconPosition === 'right' ? iconEl : null}
    </View>
  );

  const glow =
    inactive || !gradient ? null
      : variant === 'primary' ? theme.elevation.interactive
        : variant === 'safe' ? theme.elevation.safeGlow
          : theme.elevation.dangerGlow;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled: inactive, busy}}
      style={({pressed}) => [
        styles.base,
        pill && styles.pill,
        glow,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {gradient && !inactive ? (
        <LinearGradient
          colors={gradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.gradient, pill && styles.pill]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    base: {borderRadius: radius.lg},
    pill: {borderRadius: radius.full},
    gradient: {borderRadius: radius.lg},
    content: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg},
    lg: {height: 56},
    md: {height: 44, paddingHorizontal: space.md},
    label: {...typography.titleMd},
    secondary: {backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border},
    ghost: {backgroundColor: 'transparent'},
    disabled: {backgroundColor: colors.disabled},
    pressed: {transform: [{scale: 0.98}], opacity: 0.92},
  });
}
