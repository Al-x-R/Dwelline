import React, { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { NO_ZONE } from '../constants/zones';
import { calculateCompliance } from '../core/schengenCalculator';
import { toneFor, tripDaysCount, zoneRules, type ZoneTone } from '../core/zoneAnalytics';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';
import { useSettingsStore } from '../store/settingsStore';
import { deleteJourneyWithTrips } from '../store/actions';
import {
  Button, Card, ConfirmDialog, EmptyState, FlagBadge, IconButton, InfoBanner, Pill, Screen, ScreenHeader, SectionHeader,
} from '../components/ui';
import { ZoneStatusCard } from '../features/zone/ZoneStatusCard';
import {
  TRANSPORT_ICONS, daysByZone, journeyOrigin, journeyShortId, journeySpan, journeyState, journeyTrips,
} from '../features/journey/journeyUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneyDetail'>;

const TONE_RANK: Record<ZoneTone, number> = {safe: 0, warning: 1, danger: 2};

export default function JourneyDetailScreen({navigation, route}: Props) {
  const {journeyId} = route.params;
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {allZones, selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const journey = useJourneysStore((s) => s.getJourney(journeyId));
  const allTrips = useTripsStore((s) => s.trips);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const trips = useMemo(() => (journey ? journeyTrips(journey, allTrips) : []), [journey, allTrips]);
  const span = journeySpan(trips);
  const state = journeyState(span);
  const zoneDays = useMemo(() => daysByZone(trips), [trips]);

  const zoneStatuses = useMemo(() => {
    const ids = Array.from(zoneDays.keys()).filter((id) => id !== NO_ZONE);
    return ids.flatMap((id) => {
      const zone = allZones.find((z) => z.id === id);
      if (!zone) return [];
      const rules = zoneRules(zone);
      const c = calculateCompliance(allTrips, id, undefined, rules);
      const withoutJourney = calculateCompliance(
        allTrips.filter((tr) => !journey?.tripIds.includes(tr.id)), id, undefined, rules
      );
      return [{
        zone,
        rules,
        daysUsed: c.daysUsed,
        freedOnDelete: c.daysUsed - withoutJourney.daysUsed,
        tone: toneFor(c.daysUsed, rules.maxStayDays, buffer),
      }];
    });
  }, [zoneDays, allZones, allTrips, journey, buffer]);

  if (!journey) {
    return (
      <Screen>
        <ScreenHeader onBack={() => navigation.goBack()}/>
        <EmptyState icon="map-outline" title={t('journey.notFound')} framed={false}/>
      </Screen>
    );
  }

  const worst = zoneStatuses.reduce<ZoneTone>((acc, z) => (TONE_RANK[z.tone] > TONE_RANK[acc] ? z.tone : acc), 'safe');
  const origin = journeyOrigin(journey, lang);
  const primaryZone = zoneStatuses.find((z) => z.zone.id === selectedZone.id) ?? zoneStatuses[0];
  const datesLabel = span ? `${fmt.shortYear(span.start)} — ${span.isOpen ? t('common.now') : fmt.shortYear(span.end)}` : '';

  const handleShare = () =>
    Share.share({
      message: t('journey.shareText', {
        name: journey.name,
        dates: datesLabel,
        days: span ? fmt.days(span.days) : '',
      }),
    });

  const handleDelete = async () => {
    setDeleting(true);
    await deleteJourneyWithTrips(journey.id);
    setConfirmDelete(false);
    navigation.goBack();
  };

  const roleOf = (index: number) => {
    const turnaround = journey.turnaroundTripId ? trips.findIndex((tr) => tr.id === journey.turnaroundTripId) : -1;
    const main = turnaround >= 0 ? turnaround : trips.length - 1;
    if (index === main) return 'main' as const;
    return turnaround >= 0 && index > turnaround ? ('return' as const) : ('transit' as const);
  };

  return (
    <Screen glow={worst}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        actions={
          <>
            <IconButton
              icon="pencil-outline"
              onPress={() => navigation.navigate('JourneyEdit', {journeyId})}
              accessibilityLabel={t('journey.edit')}
            />
            <IconButton
              icon="trash-outline"
              tone="danger"
              onPress={() => setConfirmDelete(true)}
              accessibilityLabel={t('common.delete')}
            />
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Pill
            label={t(state === 'active' ? 'journey.active' : state === 'planned' ? 'journey.planned' : 'journey.completed')}
            tone={state === 'active' ? 'safe' : state === 'planned' ? 'primary' : 'neutral'}
            caps
            outlined
          />
          <Text style={styles.id}>{t('journey.id', {id: journeyShortId(journey)})}</Text>
        </View>
        <Text style={styles.title}>{journey.name}</Text>
        {datesLabel ? <Text style={styles.dates}>{datesLabel}</Text> : null}

        <View style={styles.chips}>
          {origin ? (
            <View style={styles.chip}>
              <Text style={styles.chipFlag}>{origin.flag}</Text>
              <Text style={styles.chipText}>{t('journey.start', {country: origin.name})}</Text>
            </View>
          ) : null}
          {span ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textBody}/>
              <Text style={styles.chipText}>{t('journey.totalDays', {count: span.days})}</Text>
            </View>
          ) : null}
        </View>

        {trips.length === 0 ? (
          <EmptyState icon="map-outline" title={t('journey.noSegments')}/>
        ) : (
          <>
            {zoneStatuses.length > 0 ? (
              <>
                <SectionHeader
                  title={t('journey.zonesStatus')}
                  variant="title"
                  caption={t('journey.rule', {rule: zoneLabel.rule(zoneStatuses[0].zone)})}
                />
                <View style={styles.stack}>
                  {zoneStatuses.map((z) => (
                    <ZoneStatusCard
                      key={z.zone.id}
                      zone={z.zone}
                      daysUsed={z.daysUsed}
                      maxDays={z.rules.maxStayDays}
                      tone={z.tone}
                      daysInJourney={zoneDays.get(z.zone.id) ?? 0}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <SectionHeader
              title={`${t('journey.segments')} • ${t('journey.segmentsTotal', {days: span ? fmt.days(span.days) : ''})}`}
              variant="title"
              actionLabel={t('journey.route')}
              onAction={() => navigation.navigate('JourneyEdit', {journeyId})}
            />
            {trips.map((trip, i) => {
              const role = roleOf(i);
              const days = tripDaysCount(trip);
              return (
                <React.Fragment key={trip.id}>
                  {i > 0 ? <View style={styles.connector}/> : null}
                  <Card
                    tone={role === 'main' ? 'safe' : undefined}
                    onPress={() => navigation.navigate('JourneyEdit', {journeyId})}
                    style={styles.segment}
                  >
                    <FlagBadge
                      flag={countryCodeToFlag(trip.countryCode)}
                      size={48}
                      badgeIcon={trip.transportMode ? TRANSPORT_ICONS[trip.transportMode] : undefined}
                    />
                    <View style={styles.segmentBody}>
                      <View style={styles.segmentTitleRow}>
                        <Text style={styles.segmentName} numberOfLines={1}>{countryName(trip.countryCode, lang)}</Text>
                        <Pill
                          label={t(`journey.role.${role}`)}
                          tone={role === 'main' ? 'safe' : 'neutral'}
                          outlined
                        />
                      </View>
                      <Text style={styles.segmentDates}>
                        {fmt.short(trip.entryDate)} — {trip.exitDate ? fmt.short(trip.exitDate) : t('common.now')}
                      </Text>
                    </View>
                    <View style={[styles.daysPill, role === 'main' && styles.daysPillMain]}>
                      <Text style={[styles.daysText, role === 'main' && styles.daysTextMain]}>{fmt.days(days)}</Text>
                    </View>
                  </Card>
                </React.Fragment>
              );
            })}

            <View style={styles.block}>
              <InfoBanner
                icon={worst === 'safe' ? 'checkmark-circle-outline' : 'warning-outline'}
                tone={worst}
                title={t(`journey.engine.${worst}`)}
                text={t(`journey.engine.${worst}Text`)}
              />
            </View>
          </>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <IconButton icon="share-social-outline" onPress={handleShare} accessibilityLabel={t('common.share')}/>
        <Button
          label={t('journey.addSegment')}
          icon="add"
          variant="safe"
          onPress={() => navigation.navigate('JourneyEdit', {journeyId, addSegment: true})}
          style={styles.flex}
        />
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmDelete}
        icon="trash-outline"
        title={t('journey.deleteTitle')}
        message={t('journey.deleteText', {
          name: journey.name,
          days: span ? fmt.days(span.days) : '0',
          zones: zoneStatuses.map((z) => zoneLabel.name(z.zone)).join(', ') || t('zone.none'),
        })}
        highlight={
          primaryZone && primaryZone.freedOnDelete > 0
            ? {
              icon: 'refresh-outline',
              title: t('journey.deleteImpactTitle'),
              text: t('journey.deleteImpact', {
                days: fmt.days(primaryZone.freedOnDelete),
                zone: zoneLabel.rule(primaryZone.zone),
              }),
            }
            : undefined
        }
        footnote={t('journey.deleteFootnote')}
        confirmLabel={t('journey.deleteConfirm')}
        confirmIcon="trash-outline"
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        busy={deleting}
      />
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: space.xl},
    flex: {flex: 1},
    metaRow: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    id: {...typography.labelMd, color: colors.textMuted},
    title: {...typography.headlineXl, color: colors.textPrimary, marginTop: space.sm},
    dates: {...typography.bodyMd, color: colors.textMuted, marginTop: 2, ...tabularNums},
    chips: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md},
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 40, paddingHorizontal: space.gutterSm,
      borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    chipFlag: {fontSize: 18},
    chipText: {...typography.bodyMd, color: colors.textBody},
    stack: {gap: space.gutterSm},
    connector: {width: 1, height: 20, backgroundColor: colors.borderStrong, alignSelf: 'center'},
    segment: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    segmentBody: {flex: 1},
    segmentTitleRow: {flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap'},
    segmentName: {...typography.titleMd, color: colors.textPrimary, flexShrink: 1},
    segmentDates: {...typography.bodySm, color: colors.textMuted, marginTop: 2, ...tabularNums},
    daysPill: {
      paddingHorizontal: space.gutterSm, paddingVertical: space.xs + 2, borderRadius: radius.DEFAULT,
      backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    },
    daysPillMain: {backgroundColor: colors.safeSoft, borderColor: colors.safe},
    daysText: {...typography.labelMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
    daysTextMain: {color: colors.safe},
    block: {marginTop: space.lg},
    footer: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, paddingHorizontal: space.md,
      paddingTop: space.gutterSm, paddingBottom: space.sm, backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
  });
}
