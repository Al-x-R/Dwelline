import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { NO_ZONE } from '../constants/zones';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useZoneSummary } from '../hooks/useZoneSummary';
import { ZoneAccessBanner } from '../features/zone/ZoneAccessBanner';
import { useT } from '../i18n';
import { useRootNavigation } from '../navigation/types';
import { isPerVisit, tripDaysCount } from '../core/zoneAnalytics';
import { shareTripsCsv } from '../services/exportService';
import { AppHeader } from '../components/app/AppHeader';
import { FLOATING_CTA_SPACE } from '../components/app/TabBar';
import { Button, Card, EmptyState, IconButton, ProgressBar, Screen, SectionHeader, toneColors } from '../components/ui';
import { JourneyCard } from '../features/journey/JourneyCard';
import { useJourneyList, type JourneyListItem } from '../features/journey/useJourneyList';

type Filter = 'all' | 'zone' | 'other';

export default function HistoryScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useRootNavigation();
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const summary = useZoneSummary(selectedZone);
  const journeys = useJourneyList();
  const [filter, setFilter] = useState<Filter>('all');
  const {rules} = summary;
  const free = summary.access.mode === 'free';

  const zoneId = selectedZone.id;
  const touchesZone = useCallback((item: JourneyListItem) => item.trips.some((tr) => tr.zoneId === zoneId), [zoneId]);
  const touchesOther = useCallback(
    (item: JourneyListItem) => item.trips.some((tr) => tr.zoneId !== zoneId && tr.zoneId !== NO_ZONE),
    [zoneId]
  );

  const counts = {
    all: journeys.length,
    zone: journeys.filter(touchesZone).length,
    other: journeys.filter(touchesOther).length,
  };

  const visible = useMemo(
    () => journeys.filter((j) => (filter === 'zone' ? touchesZone(j) : filter === 'other' ? touchesOther(j) : true)),
    [journeys, filter, touchesZone, touchesOther]
  );

  const daysInZone = useMemo(
    () => journeys.reduce((acc, j) => acc + j.trips.filter((tr) => tr.zoneId === selectedZone.id)
      .reduce((s, tr) => s + tripDaysCount(tr), 0), 0),
    [journeys, selectedZone.id]
  );

  const footnoteFor = (item: JourneyListItem) => {
    if (free) {
      const days = item.trips.filter((tr) => tr.zoneId === selectedZone.id).reduce((acc, tr) => acc + tripDaysCount(tr), 0);
      return days > 0 ? {label: `${selectedZone.flag} ${zoneLabel.short(selectedZone)} ${fmt.days(days)}`, tone: 'neutral' as const} : undefined;
    }
    if (!item.span || item.span.end < summary.windowStart) {
      const label = isPerVisit(rules) ? t('history.pastVisit') : t('history.outsideWindow', {window: rules.windowSizeDays});
      return {label, tone: 'neutral' as const};
    }
    const days = item.trips.filter((tr) => tr.zoneId === selectedZone.id).reduce((s, tr) => s + tripDaysCount(tr), 0);
    if (days === 0) return undefined;
    return {label: `${selectedZone.flag} ${zoneLabel.short(selectedZone)} ${days}/${rules.maxStayDays}`, tone: 'safe' as const};
  };

  const toneFg = toneColors(theme.colors, summary.tone).fg;

  const header = (
    <View>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>{t('history.title')}</Text>
          <Text style={styles.subtitle}>
            {t('history.total', {count: journeys.length})}
            {'   '}
            <Text style={styles.subtitleStrong}>
              {t('history.daysInZone', {count: daysInZone, zone: zoneLabel.short(selectedZone)})}
            </Text>
          </Text>
        </View>
        <IconButton icon="share-outline" onPress={() => shareTripsCsv(lang, t('history.export'))} accessibilityLabel={t('history.export')}/>
      </View>

      <View style={styles.filters}>
        {([
          ['all', `${t('common.all')} (${counts.all})`],
          ['zone', `${selectedZone.flag} ${zoneLabel.short(selectedZone)} (${counts.zone})`],
          ['other', `${t('history.filterOther')} (${counts.other})`],
        ] as [Filter, string][]).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.filter, filter === key && styles.filterActive]}
            onPress={() => setFilter(key)}
            accessibilityRole="tab"
            accessibilityState={{selected: filter === key}}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]} numberOfLines={1}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {free ? (
        <View style={styles.windowCard}>
          <ZoneAccessBanner zone={selectedZone} access={summary.access}/>
        </View>
      ) : (
        <Card style={styles.windowCard}>
          <View style={styles.windowTop}>
            <View style={styles.flex}>
              <Text style={styles.caps}>{isPerVisit(rules) ? t('history.visitCard') : t('history.windowCard', {window: rules.windowSizeDays})}</Text>
              <Text style={styles.windowValue}>
                {summary.daysUsed}
                <Text style={styles.windowMax}> / {fmt.days(rules.maxStayDays)}</Text>
              </Text>
            </View>
            <Text style={[styles.status, {color: toneFg}]}>{t(`status.${summary.tone}`)}</Text>
          </View>
          <ProgressBar progress={summary.daysUsed / rules.maxStayDays} color={toneFg}/>
          <View style={styles.windowBottom}>
            <Text style={styles.muted}>
              {t('history.remaining')} <Text style={styles.strong}>{fmt.days(summary.daysRemaining)}</Text>
            </Text>
            {summary.nextRollOff ? (
              <Text style={styles.muted}>
                {t('history.reset')} <Text style={styles.strong}>{fmt.short(summary.nextRollOff)}</Text>
              </Text>
            ) : null}
          </View>
        </Card>
      )}

      <SectionHeader title={t('history.recent')} caption={visible.length > 0 ? t('history.chronology') : undefined}/>
    </View>
  );

  return (
    <Screen>
      <AppHeader/>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.journey.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator}/>}
        ListEmptyComponent={<EmptyState icon="earth-outline" title={t('history.emptyTitle')} text={t('history.emptyText')}/>}
        ListFooterComponent={
          journeys.length > 0 ? (
            <Button
              label={t('history.report')}
              icon="document-text-outline"
              variant="secondary"
              onPress={() => navigation.navigate('MainTabs', {screen: 'Reports'})}
              style={styles.footer}
            />
          ) : null
        }
        renderItem={({item}) => (
          <JourneyCard
            journey={item.journey}
            trips={item.trips}
            footnote={footnoteFor(item)}
            onPress={() => navigation.navigate('JourneyDetail', {journeyId: item.journey.id})}
          />
        )}
      />
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: FLOATING_CTA_SPACE + space.lg},
    flex: {flex: 1},
    titleRow: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs},
    title: {...typography.headlineMd, color: colors.textPrimary},
    subtitle: {...typography.bodyMd, color: colors.textMuted, marginTop: 2},
    subtitleStrong: {fontFamily: fonts.bold, color: colors.textPrimary},
    filters: {flexDirection: 'row', gap: space.sm, marginTop: space.md},
    filter: {
      flexShrink: 1, minHeight: 36, justifyContent: 'center', paddingHorizontal: space.gutterSm,
      borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    filterActive: {backgroundColor: colors.primarySoft, borderColor: colors.accentText},
    filterText: {...typography.labelMd, fontSize: 13, color: colors.textBody},
    filterTextActive: {color: colors.accentText, fontFamily: fonts.semibold},
    windowCard: {marginTop: space.md},
    windowTop: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md},
    caps: {...typography.labelCaps, color: colors.textMuted},
    windowValue: {...typography.headlineLg, color: colors.textPrimary, marginTop: space.xs, ...tabularNums},
    windowMax: {...typography.bodyMd, color: colors.textMuted},
    status: {...typography.labelCaps, fontSize: 12},
    windowBottom: {flexDirection: 'row', justifyContent: 'space-between', marginTop: space.gutterSm},
    muted: {...typography.bodySm, color: colors.textMuted},
    strong: {fontFamily: fonts.bold, color: colors.textPrimary},
    separator: {height: space.gutterSm},
    footer: {marginTop: space.lg},
  });
}
