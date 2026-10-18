import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { NO_ZONE } from '../constants/zones';
import { summarizeZone, todayIso } from '../core/zoneAnalytics';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZones } from '../hooks/useZones';
import { useT } from '../i18n';
import { useRootNavigation } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { useTripsStore } from '../store/tripsStore';
import { useJourneysStore } from '../store/journeysStore';
import { shareTripsCsv } from '../services/exportService';
import { AppHeader } from '../components/app/AppHeader';
import { ReportPdfRow } from '../components/app/ReportPdfRow';
import { FLOATING_CTA_SPACE } from '../components/app/TabBar';
import { Card, EmptyState, ListRow, ProgressBar, Screen, SectionHeader, StatTile } from '../components/ui';
import { ZoneStatusCard } from '../features/zone/ZoneStatusCard';
import type { Trip } from '../types/Trip';
import { zoneContext } from '../core/zoneAccess';
import { useTravelDocuments } from '../hooks/useZoneContext';

const MONTHS = 12;
const CHART_HEIGHT = 120;
const TOP_COUNTRIES = 5;

// Every calendar day of every segment (open segments — up to today).
function eachTripDay(trip: Trip, today: string, visit: (day: string) => void) {
  const end = trip.exitDate ?? (trip.entryDate > today ? trip.entryDate : today);
  for (let d = dayjs(trip.entryDate); !d.isAfter(dayjs(end), 'day'); d = d.add(1, 'day')) visit(d.format('YYYY-MM-DD'));
}

export default function ReportsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useRootNavigation();
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {activeZones} = useZones();
  const trips = useTripsStore((s) => s.trips);
  const journeys = useJourneysStore((s) => s.journeys);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  const docs = useTravelDocuments();
  const setSelectedZoneId = useSettingsStore((s) => s.setSelectedZoneId);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const year = dayjs().year();
  const today = todayIso();

  const zoneSummaries = useMemo(
    () => activeZones.map((zone) => {
      const ctx = zoneContext(zone, trips, docs, today);
      return {zone, summary: summarizeZone(ctx.trips, zone, buffer, today, ctx.rules), free: ctx.access.mode === 'free'};
    }),
    [activeZones, trips, docs, buffer, today]
  );

  const stats = useMemo(() => {
    const tracked = new Set(activeZones.map((z) => z.id));
    const zoneDays = new Set<string>();
    const byCountry = new Map<string, Set<string>>();
    const monthStart = dayjs().startOf('month').subtract(MONTHS - 1, 'month');
    const monthly = Array.from({length: MONTHS}, (_, i) => ({month: monthStart.add(i, 'month'), days: new Set<string>()}));
    let tripsThisYear = 0;

    for (const trip of trips) {
      let inYear = false;
      eachTripDay(trip, today, (day) => {
        const d = dayjs(day);
        if (d.year() === year) {
          inYear = true;
          if (!byCountry.has(trip.countryCode)) byCountry.set(trip.countryCode, new Set());
          byCountry.get(trip.countryCode)!.add(day);
          if (tracked.has(trip.zoneId) && trip.zoneId !== NO_ZONE) zoneDays.add(day);
        }
        if (tracked.has(trip.zoneId)) {
          const idx = d.diff(monthStart, 'month');
          if (idx >= 0 && idx < MONTHS) monthly[idx].days.add(day);
        }
      });
      if (inYear) tripsThisYear += 1;
    }

    const countries = Array.from(byCountry.entries())
      .map(([code, days]) => ({code, days: days.size}))
      .sort((a, b) => b.days - a.days);

    return {
      tripsThisYear,
      zoneDays: zoneDays.size,
      countries,
      monthly: monthly.map((m) => ({month: m.month, days: m.days.size})),
    };
  }, [trips, activeZones, today, year]);

  const maxMonth = Math.max(1, ...stats.monthly.map((m) => m.days));
  const peakIndex = stats.monthly.findIndex((m) => m.days === maxMonth);
  const maxCountry = Math.max(1, ...stats.countries.map((c) => c.days));
  const shown = activeBar ?? peakIndex;

  return (
    <Screen>
      <AppHeader/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('reports.eyebrow')}</Text>
        <Text style={styles.title}>{t('reports.title')}</Text>

        <SectionHeader title={t('reports.zones')}/>
        <View style={styles.stack}>
          {zoneSummaries.map(({zone, summary, free}) => (
            <ZoneStatusCard
              key={zone.id}
              zone={zone}
              daysUsed={summary.daysUsed}
              maxDays={summary.rules.maxStayDays}
              daysRemaining={summary.daysRemaining}
              limitedBy={summary.limitedBy}
              tone={summary.tone}
              free={free}
              onPress={() => {
                setSelectedZoneId(zone.id);
                navigation.navigate('MainTabs', {screen: 'Calendar'});
              }}
            />
          ))}
        </View>

        {trips.length === 0 ? (
          <View style={styles.block}>
            <EmptyState icon="bar-chart-outline" title={t('reports.emptyTitle')} text={t('reports.emptyText')}/>
          </View>
        ) : (
          <>
            <SectionHeader title={t('reports.yearStats', {year})}/>
            <View style={styles.tiles}>
              <StatTile label={t('reports.trips')} value={String(stats.tripsThisYear)} icon="airplane-outline"/>
              <StatTile label={t('reports.daysInZones')} value={String(stats.zoneDays)} icon="calendar-outline" tone="safe"/>
              <StatTile label={t('reports.countries')} value={String(stats.countries.length)} icon="flag-outline" tone="warning"/>
            </View>

            <SectionHeader title={t('reports.monthly')}/>
            <Card>
              <View style={styles.chartHeader}>
                <Text style={styles.chartValue}>{fmt.days(stats.monthly[shown]?.days ?? 0)}</Text>
                <Text style={styles.muted}>{stats.monthly[shown] ? fmt.monthYear(stats.monthly[shown].month) : ''}</Text>
              </View>
              <View style={styles.chart}>
                {stats.monthly.map((m, i) => (
                  <Pressable
                    key={m.month.format('YYYY-MM')}
                    style={styles.barSlot}
                    onPress={() => setActiveBar(i === activeBar ? null : i)}
                    accessibilityRole="button"
                    accessibilityLabel={`${fmt.monthYear(m.month)}: ${fmt.days(m.days)}`}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(m.days > 0 ? 4 : 2, (m.days / maxMonth) * CHART_HEIGHT),
                          backgroundColor: m.days > 0 ? theme.colors.safe : theme.colors.track,
                          opacity: shown === i || m.days === 0 ? 1 : 0.55,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
              <View style={styles.axis}>
                {stats.monthly.map((m, i) => (
                  <Text key={m.month.format('YYYY-MM')} style={[styles.axisLabel, i === shown && styles.axisLabelActive]}>
                    {m.month.locale(lang).format('MMM').slice(0, 1).toUpperCase()}
                  </Text>
                ))}
              </View>
            </Card>

            {stats.countries.length > 0 ? (
              <>
                <SectionHeader title={t('reports.topCountries')} caption={String(year)}/>
                <Card style={styles.countries}>
                  {stats.countries.slice(0, TOP_COUNTRIES).map((c) => (
                    <View key={c.code} style={styles.countryRow}>
                      <Text style={styles.countryFlag}>{countryCodeToFlag(c.code)}</Text>
                      <View style={styles.flex}>
                        <View style={styles.countryTop}>
                          <Text style={styles.countryName}>{countryName(c.code, lang)}</Text>
                          <Text style={styles.countryDays}>{fmt.days(c.days)}</Text>
                        </View>
                        <ProgressBar progress={c.days / maxCountry} color={theme.colors.accentText} height={6}/>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
          </>
        )}

        <Card padded={false} style={[styles.block, styles.group]}>
          <ReportPdfRow/>
          <ListRow
            icon="download-outline"
            iconTone="primary"
            title={t('reports.export')}
            subtitle={`${t('reports.exportHint')} • ${t('common.trips', {count: journeys.length})}`}
            onPress={() => shareTripsCsv(lang, t('reports.export'))}
            last
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: FLOATING_CTA_SPACE + space.lg},
    flex: {flex: 1},
    eyebrow: {...typography.labelCaps, color: colors.textMuted, marginTop: space.sm},
    title: {...typography.headlineMd, color: colors.textPrimary},
    stack: {gap: space.gutterSm},
    block: {marginTop: space.lg},
    tiles: {flexDirection: 'row', gap: space.sm},
    chartHeader: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.md},
    chartValue: {...typography.headlineSm, color: colors.textPrimary, ...tabularNums},
    muted: {...typography.bodySm, color: colors.textMuted},
    chart: {flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: 2},
    barSlot: {flex: 1, height: '100%', justifyContent: 'flex-end'},
    bar: {borderTopLeftRadius: 4, borderTopRightRadius: 4, marginHorizontal: 2},
    axis: {flexDirection: 'row', gap: 2, marginTop: space.sm},
    axisLabel: {...typography.labelSm, flex: 1, textAlign: 'center', color: colors.textMuted},
    axisLabelActive: {color: colors.textPrimary, fontFamily: fonts.bold},
    countries: {gap: space.md},
    countryRow: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    countryFlag: {fontSize: 24},
    countryTop: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs + 2},
    countryName: {...typography.bodyMd, color: colors.textPrimary},
    countryDays: {...typography.labelMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
    group: {paddingHorizontal: space.md},
  });
}
