import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import type { IconName } from './types';

export const INPUT_HEIGHT = 52;

export function FieldLabel({children}: { children: string }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.label}>{children}</Text>;
}

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({label, icon, containerStyle, style, ...props}: TextFieldProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={[styles.box, focused && styles.focused]}>
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.textMuted}/> : null}
        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
      </View>
    </View>
  );
}

interface SelectFieldProps {
  value: string | null;
  placeholder: string;
  onPress: () => void;
  label?: string;
  leading?: string; // emoji flag
  icon?: IconName;
  trailingIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SelectField({
  value, placeholder, onPress, label, leading, icon, trailingIcon = 'chevron-down', style, accessibilityLabel,
}: SelectFieldProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={style}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        style={({pressed}) => [styles.box, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        accessibilityValue={value ? {text: value} : undefined}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.textMuted}/> : null}
        {leading ? <Text style={styles.leading}>{leading}</Text> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{value ?? placeholder}</Text>
        <Ionicons name={trailingIcon} size={16} color={theme.colors.textMuted}/>
      </Pressable>
    </View>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    label: {...typography.labelCaps, color: colors.textMuted, marginBottom: space.sm},
    box: {
      minHeight: INPUT_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: space.sm,
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
      paddingHorizontal: space.gutterSm,
    },
    focused: {borderColor: colors.primaryActive, ...elevation.focus},
    pressed: {opacity: 0.75},
    input: {flex: 1, height: INPUT_HEIGHT, color: colors.textPrimary, ...typography.bodyLg},
    leading: {fontSize: 20},
    value: {...typography.bodyMd, fontSize: 15, color: colors.textPrimary, flex: 1, ...tabularNums},
    placeholder: {color: colors.textMuted},
  });
}
