import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { countryName } from '../constants/countries';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { isPerVisit } from '../core/zoneAnalytics';
import { useZoneSummary } from '../hooks/useZoneSummary';
import { useT } from '../i18n';
import { useRootNavigation } from '../navigation/types';
import { AppHeader } from '../components/app/AppHeader';
import { FLOATING_CTA_SPACE } from '../components/app/TabBar';
import {
  EmptyState, InfoBanner, Pill, ProgressDial, Screen, SectionHeader, StatTile, toneColors, toneGradient,
} from '../components/ui';
import { JourneyCard } from '../features/journey/JourneyCard';
import { useJourneyList } from '../features/journey/useJourneyList';
import { ZoneAccessBanner } from '../features/zone/ZoneAccessBanner';
import { useProGate } from '../hooks/useProGate';

const RECENT_LIMIT = 3;

export default function DashboardScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useRootNavigation();
  const {requirePro} = useProGate();
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const summary = useZoneSummary(selectedZone);
  const journeys = useJourneyList();

  const {daysUsed, daysRemaining, tone, rules} = summary;
  const free = summary.access.mode === 'free';
  const toneFg = toneColors(theme.colors, tone).fg;
  const freePercent = Math.round((daysRemaining / rules.maxStayDays) * 100);

  const zoneJourneys = useMemo(
    () => journeys.filter((j) => j.trips.some((tr) => tr.zoneId === selectedZone.id)),
    [journeys, selectedZone.id]
  );

  const windowHorizon = summary.fullReset ?? dayjs().add(rules.windowSizeDays, 'day').format('YYYY-MM-DD');
  const next = summary.nextPlannedTrip;
  const daysToNext = next ? dayjs(next.entryDate).diff(dayjs().startOf('day'), 'day') : 0;

  return (
    <Screen>
      <AppHeader/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.access}>
          <ZoneAccessBanner zone={selectedZone} access={summary.access} promptPassport showRequirements/>
        </View>

        {free ? null : (
          <>
            <View style={styles.dial}>
              <ProgressDial progress={daysUsed / rules.maxStayDays} colors={toneGradient(theme, tone)}>
                <Text style={styles.dialValue} accessibilityLabel={`${daysUsed} / ${rules.maxStayDays}`}>{daysUsed}</Text>
                <Text style={styles.dialMax}>/ {rules.maxStayDays}</Text>
                <Pill label={t('dashboard.daysCaps')} tone={tone} caps outlined style={styles.dialPill}/>
              </ProgressDial>
            </View>

            <View style={[styles.status, {borderColor: theme.colors.border}]}>
              <View style={[styles.statusOrb, {backgroundColor: toneFg, boxShadow: `0 0 10px ${toneFg}`}]}/>
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, {color: toneFg}]}>{t(`dashboard.statusTitle.${tone}`)}</Text>
                <Text style={styles.statusSub}>
                  {summary.isViolation
                    ? t('dashboard.overstay', {count: summary.overageDays})
                    : t('dashboard.remaining', {count: daysRemaining})}
                </Text>
                {summary.limitedBy ? <Text style={styles.statusSub}>{zoneLabel.limitedBy(summary.limitedBy)}</Text> : null}
              </View>
              <View style={styles.freeBox}>
                <Text style={styles.freeText}>{t('dashboard.free', {percent: freePercent})}</Text>
              </View>
            </View>

            {summary.exitDeadline ? (
              <View style={styles.block}>
                <InfoBanner
                  icon="warning-outline"
                  tone="warning"
                  title={t('dashboard.exitDeadline')}
                  text={t('dashboard.exitDeadlineText', {date: fmt.full(summary.exitDeadline)})}
                />
              </View>
            ) : null}
          </>
        )}

        <View style={styles.tiles}>
          {free ? null : isPerVisit(rules) ? (
            <StatTile
              label={t('dashboard.perVisitLimit')}
              value={fmt.days(rules.maxStayDays)}
              caption={t('dashboard.resetsOnExit')}
              icon="calendar-outline"
            />
          ) : (
            <StatTile
              label={t('dashboard.currentWindow')}
              value={fmt.days(rules.windowSizeDays)}
              caption={t('dashboard.windowUntil', {date: fmt.shortYear(windowHorizon)})}
              icon="calendar-outline"
            />
          )}
          <StatTile
            label={t('dashboard.nextTrip')}
            value={next ? countryName(next.countryCode, lang) : t('dashboard.notPlanned')}
            caption={next ? t('dashboard.inDays', {count: daysToNext}) : t('dashboard.limitNotSpent')}
            captionTone={next ? 'primary' : 'safe'}
            icon="airplane-outline"
            tone="safe"
          />
        </View>

        {summary.nextRollOff && daysUsed > 0 ? (
          <Text style={styles.rollOff}>{t('dashboard.nextRollOff', {date: fmt.full(summary.nextRollOff)})}</Text>
        ) : null}

        <SectionHeader
          title={t('dashboard.recentTrips')}
          variant="title"
          count={zoneJourneys.length}
          actionLabel={zoneJourneys.length > 0 ? t('common.all') : undefined}
          onAction={() => navigation.navigate('MainTabs', {screen: 'History'})}
        />

        {zoneJourneys.length === 0 ? (
          <EmptyState
            icon="compass-outline"
            title={t('dashboard.emptyTitle')}
            text={t('dashboard.emptyText')}
            actionLabel={t('dashboard.calculate')}
            onAction={() => requirePro(() => navigation.navigate('Simulator', {zoneId: selectedZone.id}))}
          />
        ) : (
          <View style={styles.list}>
            {zoneJourneys.slice(0, RECENT_LIMIT).map((item) => (
              <JourneyCard
                key={item.journey.id}
                journey={item.journey}
                trips={item.trips}
                onPress={() => navigation.navigate('JourneyDetail', {journeyId: item.journey.id})}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: FLOATING_CTA_SPACE + space.lg},
    dial: {alignItems: 'center', marginVertical: space.lg},
    dialValue: {...typography.displayHero, fontSize: 88, lineHeight: 96, color: colors.textPrimary, ...tabularNums},
    dialMax: {...typography.headlineMd, color: colors.textMuted, ...tabularNums},
    dialPill: {alignSelf: 'center', marginTop: space.sm},
    status: {
      flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg,
      borderWidth: 1, backgroundColor: colors.surface, ...elevation.card,
    },
    statusOrb: {width: 14, height: 14, borderRadius: radius.full},
    statusText: {flex: 1},
    statusTitle: {...typography.headlineSm},
    statusSub: {...typography.bodyMd, color: colors.textBody, marginTop: 2},
    freeBox: {
      paddingHorizontal: space.gutterSm, paddingVertical: space.sm, borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, maxWidth: 110,
    },
    freeText: {...typography.labelMd, fontFamily: fonts.semibold, color: colors.textBody, ...tabularNums},
    block: {marginTop: space.md},
    tiles: {flexDirection: 'row', gap: space.gutterSm, marginTop: space.md},
    access: {marginBottom: space.md},
    rollOff: {...typography.bodySm, color: colors.textMuted, marginTop: space.gutterSm, textAlign: 'center'},
    list: {gap: space.gutterSm},
  });
}
