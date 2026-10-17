import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography, type AppTheme } from '../../../constants/theme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useT } from '../../../i18n';
import { Toggle } from '../../../components/ui';
import { DateTimeTile } from './DateTimeTile';

interface Props {
  // Crossed the border on the departure date — the usual case.
  sameDay: boolean;
  // Formatted crossing date, shown when it differs from the departure.
  date: string | null;
  onToggleSameDay: (sameDay: boolean) => void;
  onPickDate: () => void;
}

// The limit counts the day the border was crossed, which can be later than the departure (night bus, customs queue).
export function BorderCrossingRow({sameDay, date, onToggleSameDay, onPickDate}: Props) {
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('form.borderSameDay')}</Text>
        <Toggle value={sameDay} onValueChange={onToggleSameDay} accessibilityLabel={t('form.borderSameDay')}/>
      </View>
      {sameDay ? null : (
        <DateTimeTile
          inline
          label={t('form.borderDate')}
          icon="flag-outline"
          accent="warning"
          date={date}
          datePlaceholder={t('form.date')}
          timePlaceholder={t('form.time')}
          onPressDate={onPickDate}
        />
      )}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    wrap: {gap: space.sm},
    row: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    label: {...typography.bodySm, color: colors.textBody, flex: 1},
  });
}
