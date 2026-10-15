import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import type { IconName } from './types';

interface Props {
  flag: string;
  size?: number;
  // Small transport icon in the bottom-right corner.
  badgeIcon?: IconName;
}

export function FlagBadge({flag, size = 44, badgeIcon}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.box, {width: size, height: size, borderRadius: size >= 40 ? radius.md : radius.DEFAULT}]}>
      <Text style={{fontSize: size * 0.52}}>{flag}</Text>
      {badgeIcon ? (
        <View style={styles.badge}>
          <Ionicons name={badgeIcon} size={10} color={theme.colors.textPrimary}/>
        </View>
      ) : null}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    box: {
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated,
      borderWidth: 1, borderColor: colors.border,
    },
    badge: {
      position: 'absolute', right: -4, bottom: -4, width: 18, height: 18, borderRadius: radius.full,
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHighest,
      borderWidth: 1.5, borderColor: colors.surface,
    },
  });
}
