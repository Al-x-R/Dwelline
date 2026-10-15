import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Button } from './Button';
import type { IconName } from './types';

interface Props {
  icon: IconName;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  framed?: boolean;
}

export function EmptyState({icon, title, text, actionLabel, onAction, framed = true}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.box, framed && styles.framed]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={24} color={theme.colors.textBody}/>
      </View>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="md" style={styles.action}/>
      ) : null}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    box: {alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.lg},
    framed: {borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong},
    icon: {
      width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, marginBottom: space.md,
    },
    title: {...typography.headlineSm, color: colors.textPrimary, textAlign: 'center'},
    text: {...typography.bodyMd, color: colors.textMuted, textAlign: 'center', marginTop: space.sm},
    action: {marginTop: space.md},
  });
}
