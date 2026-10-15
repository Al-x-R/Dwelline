import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { space } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useT } from '../../i18n';
import { dateWithTime, timeFromDate } from '../../utils/format';
import { BottomSheet, Button } from '../ui';

interface Props {
  visible: boolean;
  title?: string;
  value: string | null; // HH:mm
  onConfirm: (time: string) => void;
  onClose: () => void;
}

export function TimePickerSheet(props: Props) {
  const {t} = useT();
  const {visible, title, value, onConfirm, onClose} = props;
  if (!visible) return null;

  // On Android the picker shows the system dialog itself.
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={dateWithTime(new Date(), value)}
        mode="time"
        is24Hour
        onValueChange={(_e, date) => onConfirm(timeFromDate(date))}
        onDismiss={onClose}
      />
    );
  }

  return (
    <BottomSheet visible={visible} title={title ?? t('timePicker.title')} onClose={onClose}>
      <IosTimeBody value={value} onConfirm={onConfirm} onClose={onClose}/>
    </BottomSheet>
  );
}

function IosTimeBody({value, onConfirm, onClose}: Pick<Props, 'value' | 'onConfirm' | 'onClose'>) {
  const theme = useAppTheme();
  const {t, lang} = useT();
  const [draft, setDraft] = useState(() => dateWithTime(new Date(), value));
  return (
    <>
      <DateTimePicker
        value={draft}
        mode="time"
        display="spinner"
        locale={lang}
        is24Hour
        themeVariant={theme.dark ? 'dark' : 'light'}
        onValueChange={(_e, date) => setDraft(date)}
      />
      <View style={styles.actions}>
        <Button label={t('common.cancel')} variant="secondary" onPress={onClose} style={styles.flex}/>
        <Button label={t('common.done')} onPress={() => onConfirm(timeFromDate(draft))} style={styles.flex}/>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actions: {flexDirection: 'row', gap: space.sm, marginVertical: space.sm},
  flex: {flex: 1},
});
