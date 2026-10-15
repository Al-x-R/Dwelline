import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useZoneSummary } from '../hooks/useZoneSummary';
import { useT } from '../i18n';
import { useRootNavigation } from '../navigation/types';
import { useTripsStore } from '../store/tripsStore';
import { useSettingsStore } from '../store/settingsStore';
import { dayInfo, isPerVisit, presenceFor, todayIso, toneFor, tripDaysCount, windowUsage } from '../core/zoneAnalytics';
import { AppHeader } from '../components/app/AppHeader';
import { FLOATING_CTA_SPACE } from '../components/app/TabBar';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { Button, Card, Pill, ProgressBar, Screen, SectionHeader, toneColors } from '../components/ui';
import { useZoneContext } from '../hooks/useZoneContext';
import { ZoneAccessBanner } from '../features/zone/ZoneAccessBanner';

export default function CalendarScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useRootNavigation();
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const summary = useZoneSummary(selectedZone);
  const trips = useTripsStore((s) => s.trips);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  const {rules} = summary;

  const [month, setMonth] = useState(() => dayjs().startOf('month'));
  const [selected, setSelected] = useState(todayIso());

  const ctx = useZoneContext(selectedZone);
  const presence = useMemo(() => presenceFor(ctx.trips, selectedZone.id), [ctx.trips, selectedZone.id]);
  const markers = useCallback(
    (date: string) => dayInfo(presence, date, rules),
    [presence, rules]
  );
  const usage = useMemo(() => windowUsage(presence, selected, rules), [presence, selected, rules]);
  const tone = toneFor(usage.daysUsed, rules.maxStayDays, buffer);
  const perVisit = isPerVisit(rules);
  const free = summary.access.mode === 'free';
  const toneFg = toneColors(theme.colors, tone).fg;

  const monthTrips = useMemo(() => {
    const start = month.startOf('month').format('YYYY-MM-DD');
    const end = month.endOf('month').format('YYYY-MM-DD');
    return trips
      .filter((tr) => tr.zoneId === selectedZone.id && tr.entryDate <= end && (tr.exitDate ?? todayIso()) >= start)
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  }, [trips, month, selectedZone.id]);

  const statusKey = tone === 'danger' ? 'calendar.violated' : tone === 'warning' ? 'calendar.atRisk' : 'calendar.stable';

  return (
    <Screen glow="primary">
      <AppHeader/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{t('calendar.eyebrow')}</Text>
            <Text style={styles.title}>
              {t('calendar.title', {rule: free ? zoneLabel.short(selectedZone) : zoneLabel.rule(selectedZone)})}
            </Text>
          </View>
          {free ? null : <Pill label={t(statusKey)} tone={tone} orb/>}
        </View>

        <View style={styles.block}>
          <ZoneAccessBanner zone={selectedZone} access={summary.access}/>
        </View>

        {free ? null : (
          <Card style={styles.block}>
            <View style={styles.reserveTop}>
              <View style={styles.flex}>
                <Text style={styles.caps}>{t('calendar.reserve')}</Text>
                <Text style={styles.reserveValue}>
                  {usage.daysRemaining}
                  <Text style={styles.reserveMax}> {t('calendar.ofDays', {max: rules.maxStayDays})}</Text>
                </Text>
              </View>
              <View style={styles.reserveRight}>
                <Text style={[styles.capsStrong, {color: toneFg}]}>{t(`status.${tone}`)}</Text>
                <Text style={styles.muted}>{t('calendar.used', {count: usage.daysUsed})}</Text>
              </View>
            </View>
            <ProgressBar progress={usage.daysUsed / rules.maxStayDays} color={toneFg}/>
            <View style={styles.scale}>
              <Text style={styles.muted}>{t('calendar.scaleMin')}</Text>
              <Text style={styles.muted}>{t('calendar.scaleMax', {max: rules.maxStayDays})}</Text>
            </View>
          </Card>
        )}

        <Card style={styles.block}>
          <MonthGrid month={month} onChangeMonth={setMonth} selected={selected} markers={markers} onSelect={setSelected}/>
          <View style={styles.legend}>
            <Legend color={theme.colors.safe} label={t('calendar.legendInZone')}/>
            <Legend color={theme.dark ? '#E6E8F0' : theme.colors.primary} label={t('calendar.legendSelected')}/>
            {perVisit || free ? null : <Legend color={theme.colors.warning} label={t('calendar.legendRollOff')}/>}
          </View>
        </Card>

        {free ? null : (
          <Card style={styles.block}>
            <View style={styles.windowHeader}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textPrimary}/>
              <Text style={styles.windowTitle}>{perVisit ? t('calendar.visitTitle') : t('calendar.windowTitle', {window: rules.windowSizeDays})}</Text>
              <Pill
                label={usage.isViolation ? t('calendar.failed') : t('calendar.passed')}
                tone={usage.isViolation ? 'danger' : 'safe'}
                icon={usage.isViolation ? 'close-circle' : 'checkmark-circle'}
              />
            </View>
            <Text style={styles.caps}>{t('calendar.interval')}</Text>
            <Text style={styles.interval}>{fmt.full(usage.windowStart)} — {fmt.full(usage.windowEnd)}</Text>
            <View style={styles.windowStats}>
              <View style={styles.flex}>
                <Text style={styles.caps}>{t('calendar.inZoneInterval')}</Text>
                <Text style={styles.stat}>{usage.daysUsed} / {rules.maxStayDays}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.caps}>{t('calendar.slot')}</Text>
                <Text style={[styles.stat, {color: toneFg}]}>{fmt.days(usage.daysRemaining)}</Text>
              </View>
            </View>
          </Card>
        )}

        {free ? null : (
          <Card style={styles.block}>
            <View style={styles.windowHeader}>
              <Ionicons name="trending-up-outline" size={20} color={theme.colors.accentText}/>
              <Text style={styles.windowTitle}>{t('calendar.forecastTitle')}</Text>
            </View>
            {summary.fullReset && summary.daysUsed > 0 ? (
              <>
                <Text style={styles.body}>{t('calendar.fullReset', {max: rules.maxStayDays})}</Text>
                <Text style={styles.resetDate}>{t('calendar.fullResetFrom', {date: fmt.full(summary.fullReset)})}</Text>
                <Text style={styles.muted}>{t('calendar.fullResetText')}</Text>
              </>
            ) : (
              <Text style={styles.body}>
                {perVisit ? t('calendar.perVisitText', {max: rules.maxStayDays}) : t('calendar.noTripsInWindow')}
              </Text>
            )}
          </Card>
        )}

        {monthTrips.length > 0 ? (
          <>
            <SectionHeader title={t('calendar.monthTrips')}/>
            <View style={styles.tripList}>
              {monthTrips.map((tr) => (
                <View key={tr.id} style={styles.tripRow}>
                  <Text style={styles.tripFlag}>{countryCodeToFlag(tr.countryCode)}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.tripName}>{countryName(tr.countryCode, lang)}</Text>
                    <Text style={styles.muted}>
                      {fmt.short(tr.entryDate)} — {tr.exitDate ? fmt.shortYear(tr.exitDate) : t('common.now')}
                    </Text>
                  </View>
                  <Text style={styles.tripDays}>{fmt.days(tripDaysCount(tr))}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Button
          label={t('calendar.calculateNew')}
          icon="analytics-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Simulator', {zoneId: selectedZone.id})}
          style={styles.block}
        />
      </ScrollView>
    </Screen>
  );
}

function Legend({color, label}: { color: string; label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, {backgroundColor: color}]}/>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: FLOATING_CTA_SPACE + space.lg},
    flex: {flex: 1},
    titleRow: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm},
    eyebrow: {...typography.labelCaps, color: colors.textMuted},
    title: {...typography.headlineMd, color: colors.textPrimary},
    block: {marginTop: space.md},
    caps: {...typography.labelCaps, color: colors.textMuted},
    capsStrong: {...typography.labelCaps, fontSize: 13},
    muted: {...typography.bodySm, color: colors.textMuted},
    body: {...typography.bodyMd, color: colors.textBody},
    reserveTop: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md},
    reserveValue: {...typography.numericMetric, color: colors.textPrimary, marginTop: space.xs, ...tabularNums},
    reserveMax: {...typography.bodyMd, color: colors.textMuted, letterSpacing: 0},
    reserveRight: {alignItems: 'flex-end', gap: space.xs},
    scale: {flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm},
    legend: {flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: space.sm, marginTop: space.md},
    legendItem: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2},
    legendDot: {width: 8, height: 8, borderRadius: radius.full},
    legendText: {...typography.labelMd, color: colors.textBody},
    windowHeader: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md},
    windowTitle: {...typography.titleMd, color: colors.textPrimary, flex: 1},
    interval: {...typography.titleMd, color: colors.textPrimary, marginTop: space.xs, ...tabularNums},
    windowStats: {flexDirection: 'row', gap: space.md, marginTop: space.md},
    stat: {...typography.headlineSm, color: colors.textPrimary, marginTop: space.xs, ...tabularNums},
    resetDate: {...typography.headlineSm, color: colors.safe, marginVertical: space.xs},
    tripList: {gap: space.sm},
    tripRow: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, padding: space.gutterSm,
      borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    tripFlag: {fontSize: 24},
    tripName: {...typography.titleMd, color: colors.textPrimary},
    tripDays: {...typography.titleMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
  });
}
