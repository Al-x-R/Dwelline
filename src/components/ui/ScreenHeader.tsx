import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography, type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useT } from '../../i18n';
import { IconButton } from './IconButton';
import type { IconName } from './types';

interface Props {
  title?: string;
  eyebrow?: string;
  onBack?: () => void;
  backIcon?: IconName;
  actions?: React.ReactNode;
}

// Stack screen header: round back button, eyebrow label and title.
export function ScreenHeader({title, eyebrow, onBack, backIcon = 'chevron-back', actions}: Props) {
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  return (
    <View style={styles.header}>
      {onBack ? <IconButton icon={backIcon} onPress={onBack} accessibilityLabel={t('common.back')}/> : null}
      <View style={styles.text}>
        {eyebrow ? <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text> : null}
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm,
      paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.gutterSm,
    },
    text: {flex: 1},
    eyebrow: {...typography.labelCaps, color: colors.safe},
    title: {...typography.headlineSm, color: colors.textPrimary},
    actions: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  });
}
