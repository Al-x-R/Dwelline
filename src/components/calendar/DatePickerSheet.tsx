import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { radius, space, typography, fonts, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useT } from '../../i18n';
import { BottomSheet, Button, Pill } from '../ui';
import { MonthGrid, type DayMarkers } from './MonthGrid';

const ISO = 'YYYY-MM-DD';

export interface DateImpact {
  ok: boolean;
  days: number; // remaining or overstay
  zoneName: string;
}

interface Props {
  visible: boolean;
  title?: string;
  value: string | null;
  onConfirm: (date: string) => void;
  onClose: () => void;
  minDate?: string;
  maxDate?: string;
  // Range start for highlighting (e.g. entry date when picking the exit date).
  rangeStart?: string | null;
  // Header pill, e.g. "Corridor: 51 / 90 d".
  corridorLabel?: string;
  markers?: (date: string) => DayMarkers;
  // Limit estimate for the selected date — banner below the calendar.
  impact?: (date: string) => DateImpact | null;
}

export function DatePickerSheet(props: Props) {
  const {t} = useT();
  return (
    <BottomSheet visible={props.visible} title={props.title ?? t('datePicker.title')} onClose={props.onClose}>
      {/* The body mounts on every open, so the draft date comes from the current value. */}
      {props.visible ? <DatePickerBody {...props}/> : null}
    </BottomSheet>
  );
}

function DatePickerBody({value, onConfirm, onClose, minDate, maxDate, rangeStart, corridorLabel, markers, impact}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const [draft, setDraft] = useState<string>(
    () => value ?? (minDate && minDate > dayjs().format(ISO) ? minDate : dayjs().format(ISO))
  );
  const [month, setMonth] = useState(() => dayjs(draft).startOf('month'));

  const result = impact?.(draft) ?? null;

  return (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {corridorLabel ? <Pill label={corridorLabel} tone="primary" style={styles.corridor}/> : null}
        <View style={styles.calendar}>
          <MonthGrid
            month={month}
            onChangeMonth={setMonth}
            selected={draft}
            range={rangeStart && draft >= rangeStart ? {start: rangeStart, end: draft} : null}
            markers={markers}
            onSelect={setDraft}
            minDate={minDate}
            maxDate={maxDate}
          />

          {result ? (
            <View style={styles.impact}>
              <Ionicons
                name={result.ok ? 'shield-checkmark-outline' : 'warning-outline'}
                size={22}
                color={result.ok ? theme.colors.safe : theme.colors.danger}
              />
              <Text style={styles.impactText}>
                {result.ok ? (
                  <>
                    {t('datePicker.withinNorm')}{' '}
                    <Text style={styles.impactStrong}>
                      {t('datePicker.willRemain', {days: t('common.days', {count: result.days}), zone: result.zoneName})}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.impactStrong, {color: theme.colors.danger}]}>
                    {t('datePicker.overLimit', {days: t('common.days', {count: result.days}), zone: result.zoneName})}
                  </Text>
                )}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button label={t('common.cancel')} variant="secondary" onPress={onClose} style={styles.action}/>
          <Button
            label={t('common.done')}
            icon="checkmark"
            iconPosition="right"
            onPress={() => onConfirm(draft)}
            style={styles.actionMain}
          />
        </View>
    </ScrollView>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    corridor: {marginBottom: space.gutterSm},
    calendar: {
      backgroundColor: colors.surfaceElevated, borderRadius: radius.xl, padding: space.md,
      borderWidth: 1, borderColor: colors.border,
    },
    impact: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, marginTop: space.md,
      padding: space.gutterSm, borderRadius: radius.lg, backgroundColor: colors.canvas,
    },
    impactText: {...typography.bodyMd, color: colors.textBody, flex: 1},
    impactStrong: {fontFamily: fonts.bold, color: colors.safe},
    actions: {flexDirection: 'row', gap: space.sm, marginTop: space.md, marginBottom: space.sm},
    action: {flex: 1},
    actionMain: {flex: 1.5},
  });
}
