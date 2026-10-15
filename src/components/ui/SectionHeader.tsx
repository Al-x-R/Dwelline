import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

interface Props {
  title: string;
  // caps — small label heading, title — large section heading.
  variant?: 'caps' | 'title';
  count?: number | string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({title, variant = 'caps', count, caption, actionLabel, onAction}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={variant === 'caps' ? styles.caps : styles.title} numberOfLines={1}>
        {title}
        {count !== undefined ? <Text style={styles.count}>  {variant === 'title' ? `(${count})` : count}</Text> : null}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action} accessibilityRole="button">
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.accentText}/>
        </Pressable>
      ) : caption ? (
        <Text style={styles.caption}>{caption}</Text>
      ) : null}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm,
      marginTop: space.lg, marginBottom: space.gutterSm,
    },
    caps: {...typography.labelCaps, color: colors.textMuted, flexShrink: 1},
    title: {...typography.headlineSm, color: colors.textPrimary, flexShrink: 1},
    count: {...typography.bodyMd, color: colors.textMuted},
    caption: {...typography.labelMd, color: colors.safe},
    action: {flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 32},
    actionText: {...typography.titleMd, fontSize: 14, color: colors.accentText},
  });
}
