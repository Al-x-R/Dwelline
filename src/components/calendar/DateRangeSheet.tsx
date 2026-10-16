import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { radius, space, typography, fonts, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFormatters } from '../../hooks/useFormatters';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useT } from '../../i18n';
import { BottomSheet, Button, Pill } from '../ui';
import type { DateImpact } from './DatePickerSheet';
import { MonthGrid, type DayMarkers } from './MonthGrid';

interface Props {
  visible: boolean;
  title?: string;
  start: string;
  end: string;
  onConfirm: (start: string, end: string) => void;
  onClose: () => void;
  minDate?: string;
  markers?: (date: string) => DayMarkers;
  // Limit estimate for the selected range — banner below the calendar.
  impact?: (start: string, end: string) => DateImpact | null;
}

// Pick a stay as two taps on the calendar: entry, then exit.
export function DateRangeSheet(props: Props) {
  const {t} = useT();
  return (
    <BottomSheet visible={props.visible} title={props.title ?? t('datePicker.rangeTitle')} onClose={props.onClose}>
      {/* Mounted per open, so the draft starts from the current range. */}
      {props.visible ? <DateRangeBody {...props}/> : null}
    </BottomSheet>
  );
}

function DateRangeBody({start, end, onConfirm, onClose, minDate, markers, impact}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const fmt = useFormatters();
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState<string | null>(end);
  // Which date the next calendar tap sets.
  const [phase, setPhase] = useState<'start' | 'end'>('start');
  const [month, setMonth] = useState(() => dayjs(start).startOf('month'));

  const select = (date: string) => {
    if (phase === 'end' && date >= draftStart) {
      setDraftEnd(date);
      setPhase('start');
      return;
    }
    setDraftStart(date);
    setDraftEnd(null);
    setPhase('end');
  };

  const focus = (next: 'start' | 'end') => {
    setPhase(next);
    setMonth(dayjs(next === 'end' ? draftEnd ?? draftStart : draftStart).startOf('month'));
  };

  const effectiveEnd = draftEnd ?? draftStart;
  const days = dayjs(effectiveEnd).diff(dayjs(draftStart), 'day') + 1;
  const result = draftEnd ? impact?.(draftStart, draftEnd) ?? null : null;

  const tile = (label: string, date: string | null, active: boolean, onPress: () => void) => (
    <Pressable
      style={({pressed}) => [styles.tile, active && styles.tileActive, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
    >
      <Text style={styles.caps}>{label}</Text>
      <Text style={[styles.tileValue, !date && styles.tilePlaceholder]}>{date ? fmt.short(date) : '—'}</Text>
    </Pressable>
  );

  return (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <View style={styles.tiles}>
        {tile(t('datePicker.rangeEntry'), draftStart, phase === 'start', () => focus('start'))}
        <Ionicons name="arrow-forward" size={18} color={theme.colors.textMuted}/>
        {tile(t('datePicker.rangeExit'), draftEnd, phase === 'end', () => focus('end'))}
        <Pill label={t('common.days', {count: days})} tone="primary"/>
      </View>
      <Text style={styles.hint}>{phase === 'end' ? t('datePicker.pickExit') : t('datePicker.pickEntry')}</Text>

      <View style={styles.calendar}>
        <MonthGrid
          month={month}
          onChangeMonth={setMonth}
          selected={draftEnd ?? draftStart}
          range={{start: draftStart, end: effectiveEnd}}
          markers={markers}
          onSelect={select}
          minDate={minDate}
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
          onPress={() => onConfirm(draftStart, effectiveEnd)}
          style={styles.actionMain}
        />
      </View>
    </ScrollView>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    tiles: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    tile: {
      flex: 1, paddingVertical: space.sm, paddingHorizontal: space.gutterSm, borderRadius: radius.lg,
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    },
    tileActive: {borderColor: colors.accentText, backgroundColor: colors.primarySoft},
    tileValue: {...typography.titleMd, color: colors.textPrimary, marginTop: 2},
    tilePlaceholder: {color: colors.textMuted},
    caps: {...typography.labelCaps, color: colors.textMuted},
    hint: {...typography.bodySm, color: colors.textMuted, marginTop: space.sm, marginBottom: space.gutterSm},
    pressed: {opacity: 0.7},
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
