import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import dayjs from 'dayjs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { isPerVisit, simulateStay, todayIso } from '../core/zoneAnalytics';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useJourneysStore } from '../store/journeysStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTripsStore } from '../store/tripsStore';
import {
  Button, Card, InfoBanner, Pill, ProgressBar, ProgressDial, Screen, ScreenHeader, SegmentedControl, SelectField,
  Toggle, toneColors, toneGradient, type Tone,
} from '../components/ui';
import { CountryPickerSheet } from '../components/app/CountryPickerSheet';
import { DatePickerSheet } from '../components/calendar/DatePickerSheet';
import { makeId } from '../features/journey/useJourneyDraft';
import { ZoneAccessBanner } from '../features/zone/ZoneAccessBanner';
import { useZoneContext } from '../hooks/useZoneContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Simulator'>;

const DEFAULT_OFFSET_DAYS = 7;
const DEFAULT_DURATION = 30;
const STEP = 5;

export default function SimulatorScreen({navigation, route}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {activeZones, allZones, selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const addTrips = useTripsStore((s) => s.addTrips);
  const addJourney = useJourneysStore((s) => s.addJourney);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  const overstayAlerts = useSettingsStore((s) => s.overstayAlerts);
  const setAlerts = useSettingsStore((s) => s.setAlerts);

  const defaultEntry = dayjs().add(DEFAULT_OFFSET_DAYS, 'day').format('YYYY-MM-DD');
  const [zoneId, setZoneId] = useState(route.params?.zoneId ?? selectedZone.id);
  const [entry, setEntry] = useState(defaultEntry);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [picked, setPicked] = useState<{ zoneId: string; code: string } | null>(null);
  const [datePicker, setDatePicker] = useState(false);
  const [countryPicker, setCountryPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const zone = allZones.find((z) => z.id === zoneId) ?? selectedZone;
  const ctx = useZoneContext(zone);
  const rules = ctx.rules;
  const perVisit = isPerVisit(rules);
  const free = ctx.access.mode === 'free';
  const zoneChoices = activeZones.some((z) => z.id === zone.id) ? activeZones : [zone, ...activeZones];

  // For single-country zones the entry country is obvious.
  const countryCode =
    zone.countryCodes.length === 1 ? zone.countryCodes[0] : picked?.zoneId === zone.id ? picked.code : null;

  const result = useMemo(
    () => simulateStay(ctx.trips, zone, entry, duration, ctx.rules),
    [ctx, zone, entry, duration]
  );
  const tone: Tone = result.isViolation ? 'danger' : result.reserveAtExit <= buffer ? 'warning' : 'safe';
  const toneFg = toneColors(theme.colors, tone).fg;
  const sliderMax = Math.max(rules.maxStayDays, duration);

  const statusLabel = result.isViolation
    ? t('simulator.denied')
    : tone === 'warning' ? t('simulator.warning') : t('simulator.allowed');

  const reset = () => {
    setEntry(defaultEntry);
    setDuration(DEFAULT_DURATION);
    setSaved(false);
  };

  const saveAsPlan = async () => {
    if (!countryCode) {
      setCountryPicker(true);
      return;
    }
    const id = makeId();
    await addTrips([{id, zoneId: zone.id, countryCode, entryDate: result.entryDate, exitDate: result.exitDate}]);
    await addJourney({
      name: t('simulator.planName', {country: countryName(countryCode, lang)}),
      originCountryName: null,
      originCountryFlag: null,
      originDepartureTime: null,
      originTransportMode: null,
      destinationCountryName: null,
      destinationCountryFlag: null,
      destinationArrivalTime: null,
      turnaroundTripId: null,
      tripIds: [id],
    });
    setSaved(true);
  };

  const share = () =>
    Share.share({
      message: [
        `${t('simulator.title')} — ${zoneLabel.name(zone)}`,
        `${fmt.full(result.entryDate)} → ${fmt.full(result.exitDate)} (${fmt.days(duration)})`,
        `${statusLabel}: ${result.daysUsedAtExit} / ${rules.maxStayDays}`,
        result.criticalExitDate ? `${t('simulator.criticalExit')}: ${fmt.full(result.criticalExitDate)}` : '',
      ].filter(Boolean).join('\n'),
    });

  const usedPart = result.usedBeforeTrip / rules.maxStayDays;
  const plannedPart = Math.min(duration, Math.max(0, rules.maxStayDays - result.usedBeforeTrip)) / rules.maxStayDays;
  const overDays = Math.max(0, result.usedBeforeTrip + duration - rules.maxStayDays);
  const freeDays = Math.max(0, rules.maxStayDays - result.usedBeforeTrip - duration);

  return (
    <Screen glow={tone}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        eyebrow={t('simulator.eyebrow')}
        title={t('simulator.title')}
        actions={<Pill label={t('simulator.active', {zone: zoneLabel.short(zone), rule: zoneLabel.rule(zone)})} tone="safe" orb/>}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('simulator.subtitle', {rule: zoneLabel.rule(zone)})}</Text>

        <View style={styles.block}>
          <ZoneAccessBanner zone={zone} access={ctx.access} showRequirements/>
        </View>

        {free ? null : (
          <>
            <Card style={[styles.block, theme.elevation[tone === 'danger' ? 'dangerGlow' : 'safeGlow']]} tone={tone}>
              <View style={styles.statusRow}>
                <View style={[styles.orb, {backgroundColor: toneFg, boxShadow: `0 0 8px ${toneFg}`}]}/>
                <Text style={[styles.statusText, {color: toneFg}]}>{statusLabel}</Text>
              </View>

              <View style={styles.resultRow}>
                <ProgressDial
                  progress={result.daysUsedAtExit / rules.maxStayDays}
                  size={136}
                  strokeWidth={12}
                  colors={toneGradient(theme, tone)}
                  showThumb={false}
                >
                  <Text style={styles.dialValue}>{result.daysUsedAtExit}</Text>
                  <Text style={styles.dialCaption}>{t('simulator.ofDays', {max: rules.maxStayDays})}</Text>
                </ProgressDial>
                <View style={styles.resultTiles}>
                  <View style={styles.resultTile}>
                    <Text style={styles.caps}>{t('simulator.continuous')}</Text>
                    <Text style={styles.tileValue}>
                      <Text style={{color: theme.colors.safe}}>{result.maxContinuousDays}</Text>{' '}
                      <Text style={styles.tileUnit}>{t('simulator.inRow', {count: result.maxContinuousDays})}</Text>
                    </Text>
                  </View>
                  <View style={styles.resultTile}>
                    <Text style={styles.caps}>{t('simulator.reserve')}</Text>
                    <Text style={styles.tileValue}>
                      {result.reserveAtExit}{' '}
                      <Text style={styles.tileUnit}>{t('simulator.inReserve', {count: result.reserveAtExit})}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.critical}>
                <View style={[styles.criticalIcon, {backgroundColor: toneColors(theme.colors, tone).bg}]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={toneFg}/>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.caps}>{t('simulator.criticalExit')}</Text>
                  <Text style={styles.criticalValue}>
                    {result.criticalExitDate
                      ? t('simulator.criticalExitValue', {date: fmt.full(result.criticalExitDate)})
                      : t('simulator.noEntry')}
                  </Text>
                </View>
                <Ionicons name="airplane-outline" size={20} color={theme.colors.textMuted}/>
              </View>
            </Card>

            {result.isViolation ? (
              <View style={styles.block}>
                <InfoBanner
                  icon="warning-outline"
                  tone="danger"
                  text={t('simulator.overstayText', {days: fmt.days(result.overageDays)})}
                />
              </View>
            ) : null}
          </>
        )}

        <Card style={styles.block}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('simulator.params')}</Text>
            <Pressable onPress={reset} hitSlop={8} style={styles.reset} accessibilityRole="button">
              <Ionicons name="refresh-outline" size={14} color={theme.colors.textBody}/>
              <Text style={styles.resetText}>{t('simulator.reset')}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t('simulator.jurisdiction')}</Text>
          <SegmentedControl
            options={zoneChoices.map((z) => ({value: z.id, label: `${zoneLabel.short(z)}`}))}
            value={zone.id}
            onChange={(id) => {
              setZoneId(id);
              setSaved(false);
            }}
          />

          <Text style={[styles.label, styles.labelGap]}>{t('simulator.entryDate')}</Text>
          <Pressable
            style={({pressed}) => [styles.dateRow, pressed && styles.pressed]}
            onPress={() => setDatePicker(true)}
            accessibilityRole="button"
          >
            <View style={styles.dateIcon}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.accentText}/>
            </View>
            <View style={styles.flex}>
              <Text style={styles.dateValue}>{fmt.full(entry)}</Text>
              <Text style={styles.muted}>{fmt.weekday(entry)}</Text>
            </View>
            <Text style={styles.link}>{t('common.edit')}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.accentText}/>
          </Pressable>

          {zone.countryCodes.length > 1 ? (
            <SelectField
              label={t('simulator.country')}
              style={styles.labelGap}
              leading={countryCode ? countryCodeToFlag(countryCode) : undefined}
              value={countryCode ? countryName(countryCode, lang) : null}
              placeholder={t('countryPicker.title')}
              onPress={() => setCountryPicker(true)}
            />
          ) : null}

          <View style={[styles.stayHeader, styles.labelGap]}>
            <Text style={styles.label}>{t('simulator.stay')}</Text>
            <View style={styles.stayPill}>
              <Text style={styles.stayValue}>{duration}</Text>
              <Text style={styles.muted}> {t('common.daysWord', {count: duration})}</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <Button
              label={`− ${t('simulator.step', {count: STEP})}`}
              variant="secondary"
              size="md"
              onPress={() => setDuration((d) => Math.max(1, d - STEP))}
              style={styles.flex}
            />
            <Button
              label={`+ ${t('simulator.step', {count: STEP})}`}
              variant="secondary"
              size="md"
              onPress={() => setDuration((d) => Math.min(sliderMax, d + STEP))}
              style={styles.flex}
            />
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={sliderMax}
            step={1}
            value={duration}
            onValueChange={(v) => setDuration(Math.round(v))}
            minimumTrackTintColor={theme.colors.accentText}
            maximumTrackTintColor={theme.colors.track}
            thumbTintColor={theme.colors.accentText}
            accessibilityLabel={t('simulator.stay')}
          />
          <View style={styles.scale}>
            <Text style={styles.scaleText}>{t('simulator.scaleMin')}</Text>
            <Text style={styles.scaleText}>{t('simulator.scaleCurrent', {days: fmt.days(duration)})}</Text>
            <Text style={styles.scaleText}>{t('simulator.scaleLimit', {days: fmt.days(rules.maxStayDays)})}</Text>
          </View>
        </Card>

        {free ? null : (
          <Card style={styles.block}>
            <View style={styles.cardHeader}>
              <Ionicons name="pulse-outline" size={20} color={theme.colors.accentText}/>
              <Text style={[styles.cardTitle, styles.flex]}>{perVisit ? t('simulator.visitDynamics') : t('simulator.dynamics', {window: rules.windowSizeDays})}</Text>
              {result.freedDuringTrip > 0 ? (
                <Pill label={t('simulator.gain', {days: fmt.days(result.freedDuringTrip)})} tone="safe" caps/>
              ) : null}
            </View>
            <Text style={styles.body}>{perVisit ? t('simulator.visitDynamicsText') : t('simulator.dynamicsText')}</Text>

            <View style={styles.timeline}>
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineText}>{t(perVisit ? 'simulator.visitStart' : 'simulator.windowStart', {date: fmt.short(result.windowStartAtExit)})}</Text>
                <Text style={styles.timelineText}>{t('simulator.entry', {date: fmt.short(result.entryDate)})}</Text>
                <Text style={styles.timelineText}>{t('simulator.exit', {date: fmt.short(result.exitDate)})}</Text>
              </View>
              <ProgressBar
                height={10}
                segments={[
                  {value: usedPart, color: theme.colors.textMuted},
                  {value: plannedPart, color: theme.colors.safe},
                  ...(overDays > 0 ? [{value: overDays / rules.maxStayDays, color: theme.colors.danger}] : []),
                ]}
              />
              <View style={styles.legendRow}>
                <Legend color={theme.colors.textMuted} label={t('simulator.usedShort')} value={`${result.usedBeforeTrip}`}/>
                <Legend color={theme.colors.safe} label={t('simulator.plannedShort')} value={`${duration}`}/>
                {overDays > 0 ? (
                  <Legend color={theme.colors.danger} label={t('simulator.overShort')} value={`${overDays}`}/>
                ) : (
                  <Legend color={theme.colors.track} label={t('simulator.freeShort')} value={`${freeDays}`}/>
                )}
              </View>
            </View>

            {perVisit ? null : (
              <View style={styles.rollOff}>
                <View style={styles.rollOffIcon}>
                  <Ionicons name="refresh-outline" size={18} color={theme.colors.safe}/>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rollOffTitle}>
                    {t('simulator.rollOff')}
                    {result.freedDuringTrip > 0 ? (
                      <Text style={{color: theme.colors.safe}}>  +{fmt.days(result.freedDuringTrip)}</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.muted}>
                    {result.firstRollOffDate
                      ? t('simulator.rollOffText', {date: fmt.full(result.firstRollOffDate), window: rules.windowSizeDays})
                      : t('simulator.noRollOff')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.alertRow}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.textBody}/>
              <View style={styles.flex}>
                <Text style={styles.alertTitle}>{t('simulator.riskAlert')}</Text>
                <Text style={styles.muted}>{t('simulator.riskAlertHint')}</Text>
              </View>
              <Toggle
                value={overstayAlerts}
                onValueChange={(v) => setAlerts({overstayAlerts: v})}
                accessibilityLabel={t('simulator.riskAlert')}
              />
            </View>
          </Card>
        )}

        <View style={[styles.block, styles.actions]}>
          <Button
            label={saved ? t('simulator.saved') : t('simulator.save')}
            icon={saved ? 'checkmark-circle' : 'bookmark-outline'}
            variant={saved ? 'safe' : 'primary'}
            onPress={saveAsPlan}
            disabled={saved || result.isViolation}
          />
          <Button label={t('common.share')} icon="share-outline" variant="secondary" onPress={share}/>
        </View>
      </ScrollView>

      <DatePickerSheet
        visible={datePicker}
        title={t('simulator.entryDate')}
        value={entry}
        minDate={todayIso()}
        onConfirm={(d) => {
          setEntry(d);
          setSaved(false);
          setDatePicker(false);
        }}
        onClose={() => setDatePicker(false)}
      />
      <CountryPickerSheet
        visible={countryPicker}
        onSelect={(code) => setPicked({zoneId: zone.id, code})}
        onClose={() => setCountryPicker(false)}
      />
    </Screen>
  );
}

function Legend({color, label, value}: { color: string; label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, {backgroundColor: color}]}/>
      <Text style={styles.legendText}>
        {label} <Text style={styles.legendValue}>{value}</Text>
      </Text>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: space.xl},
    flex: {flex: 1},
    pressed: {opacity: 0.75},
    subtitle: {...typography.bodyMd, color: colors.textBody},
    block: {marginTop: space.md},
    statusRow: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md},
    orb: {width: 8, height: 8, borderRadius: radius.full},
    statusText: {...typography.labelCaps, fontSize: 12},
    resultRow: {flexDirection: 'row', alignItems: 'center', gap: space.md},
    dialValue: {...typography.headlineXl, fontSize: 40, lineHeight: 44, color: colors.textPrimary, ...tabularNums},
    dialCaption: {...typography.labelSm, color: colors.textMuted},
    resultTiles: {flex: 1, gap: space.sm},
    resultTile: {padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, gap: space.xs},
    caps: {...typography.labelCaps, color: colors.textMuted},
    tileValue: {...typography.headlineSm, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
    tileUnit: {...typography.bodySm, color: colors.textBody},
    critical: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, marginTop: space.md, padding: space.gutterSm,
      borderRadius: radius.md, backgroundColor: colors.canvas,
    },
    criticalIcon: {width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center'},
    criticalValue: {...typography.titleMd, color: colors.textPrimary, marginTop: 2},
    cardHeader: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md},
    cardTitle: {...typography.headlineSm, color: colors.textPrimary, flex: 1},
    reset: {flexDirection: 'row', alignItems: 'center', gap: space.xs},
    resetText: {...typography.labelMd, color: colors.textBody},
    label: {...typography.labelCaps, color: colors.textMuted, marginBottom: space.sm},
    labelGap: {marginTop: space.md},
    dateRow: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, padding: space.gutterSm,
      borderRadius: radius.md, backgroundColor: colors.surfaceElevated,
    },
    dateIcon: {
      width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    dateValue: {...typography.titleMd, color: colors.textPrimary},
    muted: {...typography.bodySm, color: colors.textMuted},
    link: {...typography.labelMd, fontSize: 13, color: colors.accentText},
    stayHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    stayPill: {
      flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: space.gutterSm, paddingVertical: space.xs,
      borderRadius: radius.full, backgroundColor: colors.surfaceElevated,
    },
    stayValue: {...typography.headlineSm, fontFamily: fonts.bold, color: colors.accentText, ...tabularNums},
    stepRow: {flexDirection: 'row', gap: space.sm},
    slider: {height: 40, marginTop: space.sm},
    scale: {flexDirection: 'row', justifyContent: 'space-between'},
    scaleText: {...typography.labelSm, color: colors.textMuted},
    body: {...typography.bodyMd, color: colors.textBody},
    timeline: {marginTop: space.md, padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, gap: space.sm},
    timelineLabels: {flexDirection: 'row', justifyContent: 'space-between', gap: space.sm},
    timelineText: {...typography.labelSm, color: colors.textMuted, flexShrink: 1},
    legendRow: {flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm},
    legend: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2},
    legendDot: {width: 8, height: 8, borderRadius: radius.full},
    legendText: {...typography.labelMd, color: colors.textMuted},
    legendValue: {fontFamily: fonts.bold, color: colors.textPrimary},
    rollOff: {
      flexDirection: 'row', gap: space.gutterSm, marginTop: space.md, padding: space.gutterSm,
      borderRadius: radius.md, backgroundColor: colors.surfaceElevated,
    },
    rollOffIcon: {
      width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.safeSoft,
    },
    rollOffTitle: {...typography.titleMd, fontSize: 15, color: colors.textPrimary},
    alertRow: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, marginTop: space.md},
    alertTitle: {...typography.titleMd, fontSize: 15, color: colors.textPrimary},
    actions: {gap: space.sm},
  });
}
