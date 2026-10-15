import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useFormatters } from '../../hooks/useFormatters';
import { useSettingsStore } from '../../store/settingsStore';
import { useT } from '../../i18n';
import { formatDate } from '../../utils/format';

const ISO = 'YYYY-MM-DD';

export interface DayMarkers {
  inZone?: boolean;
  rollOff?: boolean;
  disabled?: boolean;
}

interface Props {
  month: dayjs.Dayjs;
  onChangeMonth: (month: dayjs.Dayjs) => void;
  selected?: string | null;
  // Range highlight (e.g. a segment from entry to exit).
  range?: { start: string; end: string } | null;
  markers?: (date: string) => DayMarkers;
  onSelect?: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  headerIcon?: boolean;
}

export function MonthGrid({
  month, onChangeMonth, selected, range, markers, onSelect, minDate, maxDate, headerIcon = true,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t, lang} = useT();
  const weekStart = useSettingsStore((s) => s.weekStart);
  const today = dayjs().format(ISO);

  const weekdays = useMemo(() => {
    const first = dayjs().day(weekStart);
    return Array.from({length: 7}, (_, i) => formatDate(first.add(i, 'day'), 'dd', lang).toUpperCase());
  }, [lang, weekStart]);

  const weeks = useMemo(() => {
    const start = month.startOf('month');
    const lead = (start.day() - weekStart + 7) % 7;
    const gridStart = start.subtract(lead, 'day');
    const totalWeeks = Math.ceil((lead + start.daysInMonth()) / 7);
    return Array.from({length: totalWeeks}, (_, w) =>
      Array.from({length: 7}, (_, d) => gridStart.add(w * 7 + d, 'day'))
    );
  }, [month, weekStart]);

  const canPrev = !minDate || month.startOf('month').isAfter(dayjs(minDate), 'month');
  const canNext = !maxDate || month.endOf('month').isBefore(dayjs(maxDate), 'month');

  return (
    <View>
      <View style={styles.header}>
        {headerIcon ? <Ionicons name="calendar-outline" size={18} color={theme.colors.accentText}/> : null}
        <Text style={styles.title}>{fmt.monthYear(month)}</Text>
        <Pressable
          style={({pressed}) => [styles.nav, pressed && styles.pressed, !canPrev && styles.navDisabled]}
          onPress={() => onChangeMonth(month.subtract(1, 'month'))}
          disabled={!canPrev}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.prevMonth')}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.textBody}/>
        </Pressable>
        <Pressable
          style={({pressed}) => [styles.nav, pressed && styles.pressed, !canNext && styles.navDisabled]}
          onPress={() => onChangeMonth(month.add(1, 'month'))}
          disabled={!canNext}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textBody}/>
        </Pressable>
      </View>

      <View style={styles.row}>
        {weekdays.map((w) => (
          <Text key={w} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].format(ISO)} style={styles.row}>
          {week.map((day) => {
            const iso = day.format(ISO);
            const inMonth = day.isSame(month, 'month');
            const m = markers?.(iso) ?? {};
            const outOfBounds = (minDate && iso < minDate) || (maxDate && iso > maxDate);
            const disabled = !!m.disabled || !!outOfBounds;
            const isSelected = iso === selected;
            const inRange = !!range && iso >= range.start && iso <= range.end;
            const isToday = iso === today;
            return (
              <View key={iso} style={[styles.cellWrap, inRange && inMonth && styles.rangeBand]}>
                <Pressable
                  onPress={() => onSelect?.(iso)}
                  disabled={!onSelect || disabled}
                  style={({pressed}) => [
                    styles.cell,
                    m.inZone && inMonth && !isSelected && styles.inZone,
                    isToday && !isSelected && styles.today,
                    isSelected && styles.selected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole={onSelect ? 'button' : 'text'}
                  accessibilityLabel={fmt.full(day)}
                  accessibilityState={{selected: isSelected, disabled}}
                >
                  <Text
                    style={[
                      styles.dayText,
                      m.inZone && styles.dayInZone,
                      m.rollOff && styles.dayRollOff,
                      (!inMonth || disabled) && styles.dayMuted,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    {day.date()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    header: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md},
    title: {...typography.titleMd, color: colors.textPrimary, flex: 1},
    nav: {
      width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    navDisabled: {opacity: 0.3},
    pressed: {opacity: 0.7},
    row: {flexDirection: 'row'},
    weekday: {...typography.labelSm, flex: 1, textAlign: 'center', color: colors.textMuted, marginBottom: space.sm},
    cellWrap: {flex: 1, alignItems: 'center', paddingVertical: 3},
    rangeBand: {backgroundColor: colors.surfaceHighest},
    cell: {width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center'},
    inZone: {backgroundColor: colors.safeSoft},
    today: {borderWidth: 1.5, borderColor: colors.accentText},
    selected: {backgroundColor: colors.selectedDay, ...elevation.selectedDay},
    dayText: {...typography.bodyLg, color: colors.textPrimary, ...tabularNums},
    dayInZone: {fontFamily: fonts.bold, color: colors.safe},
    dayRollOff: {color: colors.warning},
    dayMuted: {color: colors.textMuted, opacity: 0.45},
    daySelected: {fontFamily: fonts.bold, color: colors.onSelectedDay},
  });
}
