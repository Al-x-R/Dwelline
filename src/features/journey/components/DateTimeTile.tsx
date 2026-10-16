import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { IconName } from '../../../components/ui';

interface Props {
  label: string;
  icon: IconName;
  date: string | null; // already formatted
  time?: string | null;
  datePlaceholder: string;
  timePlaceholder: string;
  onPressDate?: () => void;
  onPressTime?: () => void;
  accent?: 'safe' | 'warning';
  // Date and time side by side (full-width rows) instead of stacked (half-width tiles).
  inline?: boolean;
}

// Arrival / Departure tile: date and time are two separate tappable fields.
export function DateTimeTile({
  label, icon, date, time, datePlaceholder, timePlaceholder, onPressDate, onPressTime, accent = 'safe', inline,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const iconColor = accent === 'safe' ? theme.colors.safe : theme.colors.warning;
  return (
    <View style={styles.tile}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={14} color={iconColor}/>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
      <View style={[styles.fields, inline && styles.fieldsInline]}>
        <Field
          icon="calendar-outline"
          value={date}
          placeholder={datePlaceholder}
          onPress={onPressDate}
          accessibilityLabel={`${label}: ${date ?? datePlaceholder}`}
        />
        {onPressTime ? (
          <Field
            icon="time-outline"
            value={time || null}
            placeholder={timePlaceholder}
            onPress={onPressTime}
            accent
            accessibilityLabel={`${label}: ${time || timePlaceholder}`}
          />
        ) : null}
      </View>
    </View>
  );
}

interface FieldProps {
  icon: IconName;
  value: string | null;
  placeholder: string;
  onPress?: () => void;
  accent?: boolean;
  accessibilityLabel: string;
}

function Field({icon, value, placeholder, onPress, accent, accessibilityLabel}: FieldProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      style={({pressed}) => [styles.field, !onPress && styles.fieldStatic, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={15} color={theme.colors.textMuted}/>
      <Text
        style={[styles.value, accent && styles.accent, !value && styles.placeholder]}
        numberOfLines={1}
      >
        {value ?? placeholder}
      </Text>
    </Pressable>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    tile: {flex: 1, padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, gap: space.sm},
    labelRow: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2},
    label: {...typography.labelCaps, color: colors.textMuted, flexShrink: 1},
    fields: {gap: space.xs + 2},
    fieldsInline: {flexDirection: 'row'},
    field: {
      flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: space.xs + 2,
      paddingHorizontal: space.sm, borderRadius: radius.DEFAULT, backgroundColor: colors.input,
      borderWidth: 1, borderColor: colors.border,
    },
    fieldStatic: {backgroundColor: 'transparent', borderStyle: 'dashed'},
    pressed: {opacity: 0.7},
    value: {...typography.titleMd, fontSize: 14, color: colors.textPrimary, flexShrink: 1, ...tabularNums},
    accent: {fontFamily: fonts.bold, color: colors.accentText},
    placeholder: {color: colors.textMuted, fontFamily: fonts.regular},
  });
}
