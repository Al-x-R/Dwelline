import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { radius, space, typography, fonts, ZONE_PALETTE, type AppTheme } from '../../constants/theme';
import { countryCodeToFlag, countryName } from '../../constants/countries';
import { NO_ZONE } from '../../constants/zones';
import type { Trip } from '../../types/Trip';
import { buildPresenceSet } from '../../core/schengenCalculator';
import { isPerVisit, todayIso, toneForUsage, tripDaysCount, windowUsage } from '../../core/zoneAnalytics';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useFormatters } from '../../hooks/useFormatters';
import { useZoneLabel, useZones, zoneIdForCountry } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripsStore } from '../../store/tripsStore';
import { formatDuration } from '../../utils/format';
import { Button, Card, Screen, SectionHeader, SelectField, TextField, type Tone } from '../../components/ui';
import { CountryPickerSheet } from '../../components/app/CountryPickerSheet';
import { DatePickerSheet, type DateImpact } from '../../components/calendar/DatePickerSheet';
import { TimePickerSheet } from '../../components/calendar/TimePickerSheet';
import {
  buildTrips, pointBorderDate, pointDepartureDate, pointEntryDate, pointRole, stopoverMinutes, useJourneyDraft, validateDraft,
  type JourneyDraft,
} from './useJourneyDraft';
import { RouteCard } from './components/RouteCard';
import { DateTimeTile } from './components/DateTimeTile';
import { TravelTimeCard } from './components/TravelTimeCard';
import { useRouteNodes } from './useRouteNodes';
import { PointCard } from './components/PointCard';
import { BorderCrossingRow } from './components/BorderCrossingRow';
import { ImpactCard, type ImpactRow } from './components/ImpactCard';
import { TransportPicker } from './components/TransportPicker';
import { zoneContext } from '../../core/zoneAccess';
import { useTravelDocuments } from '../../hooks/useZoneContext';

type CountryTarget = { kind: 'origin' } | { kind: 'point'; index: number };
type DateTarget =
  | { kind: 'origin' }
  | { kind: 'originBorder' }
  | { kind: 'arrival'; index: number }
  | { kind: 'departure'; index: number }
  | { kind: 'border'; index: number };
type TimeTarget =
  | { kind: 'origin' }
  | { kind: 'arrival'; index: number }
  | { kind: 'departure'; index: number };

interface Props {
  mode: 'new' | 'edit';
  initialDraft: () => JourneyDraft;
  // Segments of the journey being edited — excluded from the limit calculation so they aren't counted twice.
  excludeTripIds?: string[];
  onSave: (draft: JourneyDraft, trips: Trip[]) => Promise<void>;
  onCancel: () => void;
}

export function JourneyForm({mode, initialDraft, excludeTripIds = [], onSave, onCancel}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t, lang} = useT();
  const {allZones, selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const allTrips = useTripsStore((s) => s.trips);
  const buffer = useSettingsStore((s) => s.safetyBufferDays);
  const docs = useTravelDocuments();
  const {draft, update, updatePoint, addPoint, removePoint, setName, legs} = useJourneyDraft(initialDraft, lang);

  const [countryTarget, setCountryTarget] = useState<CountryTarget | null>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget | null>(null);
  const [timeTarget, setTimeTarget] = useState<TimeTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // State updates land a render later; a ref blocks a second tap that arrives before that (duplicate journeys).
  const saveStarted = useRef(false);

  const otherTrips = useMemo(() => {
    const exclude = new Set(excludeTripIds);
    return allTrips.filter((tr) => !exclude.has(tr.id));
  }, [allTrips, excludeTripIds]);

  const validity = validateDraft(draft);
  const completePoints = draft.points.every((p) => p.countryCode && p.arrivalDate);
  const draftTrips = useMemo(
    () => (completePoints ? buildTrips(draft, allZones) : []),
    [draft, allZones, completePoints]
  );

  const zoneOf = (code: string | null) => (code ? allZones.find((z) => z.id === zoneIdForCountry(code, allZones)) : undefined);

  // ── Limit impact ────────────────────────────────────────────────────
  const impact = useMemo(() => {
    if (draftTrips.length === 0) return null;
    const touched = Array.from(new Set(draftTrips.map((tr) => tr.zoneId).filter((z) => z !== NO_ZONE)));
    const zone = allZones.find((z) => z.id === (touched.includes(selectedZone.id) ? selectedZone.id : touched[0])) ?? selectedZone;
    const ctx = zoneContext(zone, [...otherTrips, ...draftTrips], docs);
    const rules = ctx.rules;
    const free = ctx.access.mode === 'free';
    const last = draftTrips[draftTrips.length - 1];
    const end = last.exitDate ?? (last.entryDate > todayIso() ? last.entryDate : todayIso());
    const presence = buildPresenceSet(ctx.trips, zone.id, todayIso());
    const usage = windowUsage(presence, end, rules);
    const zoneDays = draftTrips.filter((tr) => tr.zoneId === zone.id);
    const lastInZone = zoneDays.length ? zoneDays[zoneDays.length - 1].exitDate ?? end : null;

    const rowZones = Array.from(new Set([...touched, selectedZone.id]));
    const rows: ImpactRow[] = rowZones.map((zid, i) => {
      const z = allZones.find((zz) => zz.id === zid);
      const days = draftTrips.filter((tr) => tr.zoneId === zid).reduce((s, tr) => s + tripDaysCount(tr), 0);
      return {
        key: zid,
        label: `${z?.flag ?? ''} ${zoneLabel.name(z)}`,
        color: ZONE_PALETTE[i % ZONE_PALETTE.length],
        value: days > 0 ? t('form.plusDays', {days: fmt.days(days)}) : t('form.untouched'),
      };
    });
    const untracked = draftTrips.filter((tr) => tr.zoneId === NO_ZONE).reduce((s, tr) => s + tripDaysCount(tr), 0);
    if (untracked > 0) {
      rows.push({key: NO_ZONE, label: t('zone.none'), color: theme.colors.textMuted, value: fmt.days(untracked)});
    }

    return {
      title: free ? t('form.impactZone', {zone: zoneLabel.name(zone)}) : t('form.impact', {rule: zoneLabel.rule(zone)}),
      free,
      tone: toneForUsage(usage, buffer),
      used: usage.daysUsed,
      max: rules.maxStayDays,
      remaining: fmt.days(usage.daysRemaining),
      windowReset: lastInZone && !isPerVisit(rules) ? fmt.dayMonth(dayjs(lastInZone).add(rules.windowSizeDays, 'day')) : null,
      rows,
    };
  }, [draftTrips, otherTrips, allZones, selectedZone, zoneLabel, buffer, docs, fmt, t, theme.colors.textMuted]);

  // Estimate for the last point's departure sheet: what's left in its zone.
  const lastIndex = draft.points.length - 1;
  const exitImpact = (date: string): DateImpact | null => {
    const lastPoint = draft.points[lastIndex];
    const zone = zoneOf(lastPoint.countryCode);
    if (!zone || !completePoints) return null;
    const withExit = {...draft, points: draft.points.map((p, i) => (i === lastIndex ? {...p, departureDate: date} : p))};
    const ctx = zoneContext(zone, [...otherTrips, ...buildTrips(withExit, allZones)], docs);
    if (ctx.access.mode === 'free') return null;
    const rules = ctx.rules;
    const presence = buildPresenceSet(ctx.trips, zone.id, todayIso());
    const usage = windowUsage(presence, date, rules);
    return {
      ok: !usage.isViolation,
      days: usage.isViolation ? usage.overageDays : usage.daysRemaining,
      zoneName: zoneLabel.short(zone),
    };
  };

  const corridorLabelFor = (code: string | null) => {
    const zone = zoneOf(code);
    if (!zone) return undefined;
    const ctx = zoneContext(zone, otherTrips, docs);
    if (ctx.access.mode === 'free') return undefined;
    const rules = ctx.rules;
    const usage = windowUsage(buildPresenceSet(ctx.trips, zone.id, todayIso()), todayIso(), rules);
    return t('datePicker.corridor', {used: usage.daysUsed, max: rules.maxStayDays});
  };

  const nodes = useRouteNodes(draft, legs);

  // ── Saving ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (validity === 'incomplete') return;
    if (validity === 'order') {
      Alert.alert(t('form.invalidDateTitle'), t('form.invalidDateText'));
      return;
    }
    if (saveStarted.current) return;
    saveStarted.current = true;
    setSaving(true);
    try {
      await onSave(draft, buildTrips(draft, allZones));
      setSaved(true);
    } catch (e) {
      // Nothing was saved: let the user try again.
      saveStarted.current = false;
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // ── Pickers ─────────────────────────────────────────────────────────
  const orUndef = (d: string | null | undefined) => d ?? undefined;
  const nextArrival = (index: number) => orUndef(draft.points[index + 1]?.arrivalDate);
  const pickerRange = (target: DateTarget | null): { value: string | null; min?: string; max?: string } => {
    switch (target?.kind) {
      case 'origin':
        return {value: draft.originDate, max: orUndef(draft.points[0]?.arrivalDate)};
      case 'originBorder':
        return {value: draft.originBorderDate, min: orUndef(draft.originDate), max: orUndef(draft.points[0]?.arrivalDate)};
      case 'arrival': {
        const prev = target.index > 0 ? pointDepartureDate(draft, target.index - 1) : draft.originDate;
        return {value: draft.points[target.index].arrivalDate, min: orUndef(prev)};
      }
      case 'departure':
        return {
          value: pointDepartureDate(draft, target.index),
          min: orUndef(draft.points[target.index].arrivalDate),
          max: nextArrival(target.index),
        };
      case 'border':
        return {
          value: pointBorderDate(draft, target.index),
          min: orUndef(pointDepartureDate(draft, target.index)),
          max: nextArrival(target.index),
        };
      default:
        return {value: null};
    }
  };
  const picker = pickerRange(dateTarget);
  const exitTarget = dateTarget?.kind === 'departure' && dateTarget.index === lastIndex;

  const confirmDate = (date: string) => {
    if (dateTarget?.kind === 'origin') update({originDate: date});
    if (dateTarget?.kind === 'originBorder') update({originBorderDate: date});
    if (dateTarget?.kind === 'arrival') updatePoint(dateTarget.index, {arrivalDate: date});
    if (dateTarget?.kind === 'departure') updatePoint(dateTarget.index, {departureDate: date});
    if (dateTarget?.kind === 'border') updatePoint(dateTarget.index, {borderDate: date});
    setDateTarget(null);
  };

  // Turning "same day" off starts from the next arrival date (the usual night-crossing case), or the day after departure.
  const firstCrossingGuess = (departure: string | null, arrival: string | null) => {
    if (!departure) return null;
    if (arrival && arrival > departure) return arrival;
    return dayjs(departure).add(1, 'day').format('YYYY-MM-DD');
  };

  const timeValue =
    timeTarget?.kind === 'origin' ? draft.originTime
      : timeTarget?.kind === 'arrival' ? draft.points[timeTarget.index].arrivalTime ?? null
        : timeTarget?.kind === 'departure' ? draft.points[timeTarget.index].departureTime ?? null
          : null;

  const confirmTime = (time: string) => {
    if (timeTarget?.kind === 'origin') update({originTime: time});
    if (timeTarget?.kind === 'arrival') updatePoint(timeTarget.index, {arrivalTime: time});
    if (timeTarget?.kind === 'departure') updatePoint(timeTarget.index, {departureTime: time});
    setTimeTarget(null);
  };

  const selectCountry = (code: string) => {
    if (countryTarget?.kind === 'origin') update({originCode: code});
    if (countryTarget?.kind === 'point') updatePoint(countryTarget.index, {countryCode: code});
  };

  const zoneTagFor = (code: string | null): { tag: { label: string; tone: Tone }; caption: string } => {
    const zone = zoneOf(code);
    if (!code) return {tag: {label: '—', tone: 'neutral'}, caption: t('form.country')};
    if (!zone) return {tag: {label: t('zone.none'), tone: 'neutral'}, caption: t('form.zoneUntracked')};
    return {
      tag: {label: zoneLabel.short(zone), tone: zone.id === selectedZone.id ? 'safe' : 'primary'},
      caption: zone.isMultiCountry ? zoneLabel.name(zone) : t('form.zoneOwnLimit', {rule: zoneLabel.rule(zone)}),
    };
  };

  const canSave = validity !== 'incomplete' && !saving && !saved;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={({pressed}) => [styles.topButton, pressed && styles.pressed]} onPress={onCancel} accessibilityRole="button">
          <Text style={styles.topButtonText}>{t('common.cancel')}</Text>
        </Pressable>
        <View style={styles.topTitle}>
          <Text style={styles.eyebrow}>{t('form.eyebrow')}</Text>
          <Text style={styles.title} numberOfLines={1}>{mode === 'new' ? t('form.titleNew') : t('form.titleEdit')}</Text>
        </View>
        <Pressable
          style={({pressed}) => [styles.topButton, styles.topButtonPrimary, !canSave && styles.disabled, pressed && styles.pressed]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityState={{disabled: !canSave}}
        >
          <Text style={[styles.topButtonText, styles.topButtonPrimaryText]}>{t('common.done')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {nodes.length > 1 ? (
          <RouteCard
            nodes={nodes}
            legs={legs}
            title={draft.name || t('form.defaultName')}
            subtitle={draft.points[0]?.arrivalDate ? fmt.shortYear(draft.originDate ?? draft.points[0].arrivalDate) : undefined}
          />
        ) : null}

        <SectionHeader title={t('form.basics')}/>
        <Card style={styles.stack}>
          <TextField
            label={t('form.name')}
            icon="create-outline"
            value={draft.name}
            onChangeText={setName}
            placeholder={t('form.namePlaceholder')}
          />
          <SelectField
            label={t('form.origin')}
            leading={draft.originCode ? countryCodeToFlag(draft.originCode) : undefined}
            value={draft.originCode ? countryName(draft.originCode, lang) : null}
            placeholder={t('common.notSet')}
            onPress={() => setCountryTarget({kind: 'origin'})}
          />
          <DateTimeTile
            inline
            label={t('form.originDeparture')}
            icon="arrow-forward-circle-outline"
            accent="warning"
            date={draft.originDate ? fmt.short(draft.originDate) : null}
            time={draft.originTime}
            datePlaceholder={t('form.date')}
            timePlaceholder={t('form.time')}
            onPressDate={() => setDateTarget({kind: 'origin'})}
            onPressTime={() => setTimeTarget({kind: 'origin'})}
          />
          <View style={styles.stackSm}>
            <Text style={styles.caps}>{t('form.transport')}</Text>
            <TransportPicker value={draft.originTransport} onChange={(m) => update({originTransport: m})}/>
          </View>
          {draft.originDate && draft.originTransport !== 'plane' ? (
            <BorderCrossingRow
              sameDay={!draft.originBorderDate}
              date={draft.originBorderDate ? fmt.short(draft.originBorderDate) : null}
              onToggleSameDay={(same) =>
                update({originBorderDate: same ? null : firstCrossingGuess(draft.originDate, draft.points[0]?.arrivalDate ?? null)})
              }
              onPickDate={() => setDateTarget({kind: 'originBorder'})}
            />
          ) : null}
        </Card>

        <SectionHeader
          title={t('form.stops')}
          caption={t('form.stopsCount', {count: draft.points.length})}
        />
        <View style={styles.stack}>
          {draft.points.map((p, i) => {
            const isLast = i === draft.points.length - 1;
            const role = pointRole(draft, i);
            const departure = pointDepartureDate(draft, i);
            const entry = pointEntryDate(draft, i);
            const exit = pointBorderDate(draft, i);
            const stop = stopoverMinutes(draft, i);
            const zoneInfo = zoneTagFor(p.countryCode);
            // Long stays show counted days; short ones show the stopover length.
            const showStay = role === 'main' || (isLast && role !== 'final');
            const stayDays = showStay && entry && exit ? dayjs(exit).diff(dayjs(entry), 'day') + 1 : null;
            const canCross = role !== 'final' && !!departure && p.transportMode !== 'plane';
            return (
              <React.Fragment key={p.id}>
                {draft.turnaroundIndex !== null && i === draft.turnaroundIndex + 1 ? <ReturnDivider label={t('form.returnRoute')}/> : null}
                <PointCard
                  index={i}
                  role={role}
                  flag={p.countryCode ? countryCodeToFlag(p.countryCode) : null}
                  countryLabel={p.countryCode ? countryName(p.countryCode, lang) : null}
                  zoneTag={zoneInfo.tag}
                  zoneCaption={zoneInfo.caption}
                  arrivalDate={p.arrivalDate ? fmt.short(p.arrivalDate) : null}
                  arrivalTime={p.arrivalTime}
                  departureDate={departure ? fmt.short(departure) : null}
                  departureTime={p.departureTime}
                  isLast={isLast}
                  hasOutgoing={!isLast}
                  transportMode={p.transportMode}
                  stopover={!isLast && !showStay && stop ? formatDuration(stop, t, {days: true}) : null}
                  stayLabel={stayDays ? t('form.stayValue', {count: stayDays}) : null}
                  isTurnaround={draft.turnaroundIndex === i}
                  canTurnaround={!isLast && (draft.turnaroundIndex === null || draft.turnaroundIndex === i)}
                  isFinal={role === 'final'}
                  canFinal={isLast && draft.turnaroundIndex !== null && i > draft.turnaroundIndex}
                  canRemove={draft.points.length > 1}
                  onPickCountry={() => setCountryTarget({kind: 'point', index: i})}
                  onPickArrivalDate={() => setDateTarget({kind: 'arrival', index: i})}
                  onPickArrivalTime={() => setTimeTarget({kind: 'arrival', index: i})}
                  onPickDepartureDate={() => setDateTarget({kind: 'departure', index: i})}
                  onPickDepartureTime={() => setTimeTarget({kind: 'departure', index: i})}
                  onTransport={(mode) => updatePoint(i, {transportMode: mode})}
                  onToggleTurnaround={(on) => update(on ? {turnaroundIndex: i} : {turnaroundIndex: null, hasFinal: false})}
                  onToggleFinal={(on) => {
                    // Journeys usually end back home.
                    if (on && !p.countryCode && draft.originCode) updatePoint(i, {countryCode: draft.originCode});
                    update({hasFinal: on});
                  }}
                  onClearExit={() => updatePoint(i, {departureDate: null, borderDate: null})}
                  border={canCross ? (
                    <BorderCrossingRow
                      sameDay={!p.borderDate}
                      date={exit ? fmt.short(exit) : null}
                      onToggleSameDay={(same) =>
                        updatePoint(i, {borderDate: same ? null : firstCrossingGuess(departure, draft.points[i + 1]?.arrivalDate ?? null)})
                      }
                      onPickDate={() => setDateTarget({kind: 'border', index: i})}
                    />
                  ) : null}
                  onRemove={() => removePoint(i)}
                />
              </React.Fragment>
            );
          })}

          {draft.hasFinal ? null : (
            <Pressable style={({pressed}) => [styles.addButton, pressed && styles.pressed]} onPress={addPoint} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.accentText}/>
              <Text style={styles.addButtonText}>{t('form.addSegment')}</Text>
            </Pressable>
          )}
        </View>

        {impact ? (
          <View style={styles.block}>
            <ImpactCard {...impact}/>
          </View>
        ) : null}

        {legs.length > 0 ? (
          <>
            <SectionHeader title={t('form.travelTime')}/>
            <TravelTimeCard legs={legs}/>
          </>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          label={saved ? t('form.saved') : mode === 'new' ? t('form.save') : t('form.saveChanges')}
          icon={saved ? 'checkmark-circle' : 'bookmark-outline'}
          variant={saved ? 'safe' : 'primary'}
          onPress={handleSave}
          disabled={validity === 'incomplete'}
          busy={saving}
        />
      </SafeAreaView>

      <CountryPickerSheet
        visible={countryTarget !== null}
        onSelect={selectCountry}
        onClose={() => setCountryTarget(null)}
        onClear={
          countryTarget?.kind === 'origin' ? () => update({originCode: null, originDate: null, originTime: null}) : undefined
        }
      />
      <DatePickerSheet
        visible={dateTarget !== null}
        title={
          exitTarget ? t('form.exitDate')
            : dateTarget?.kind === 'origin' ? t('form.originDeparture')
              : dateTarget?.kind === 'departure' ? t('form.departure')
                : dateTarget?.kind === 'border' || dateTarget?.kind === 'originBorder' ? t('form.borderDate')
                  : t('form.arrival')
        }
        value={picker.value}
        minDate={picker.min}
        maxDate={picker.max}
        rangeStart={exitTarget ? draft.points[lastIndex].arrivalDate : null}
        corridorLabel={
          dateTarget?.kind === 'arrival' || dateTarget?.kind === 'departure' || dateTarget?.kind === 'border'
            ? corridorLabelFor(draft.points[dateTarget.index].countryCode)
            : undefined
        }
        impact={exitTarget ? exitImpact : undefined}
        onConfirm={confirmDate}
        onClose={() => setDateTarget(null)}
      />
      <TimePickerSheet
        visible={timeTarget !== null}
        value={timeValue}
        onConfirm={confirmTime}
        onClose={() => setTimeTarget(null)}
      />
    </Screen>
  );
}

function ReturnDivider({label}: { label: string }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine}/>
      <View style={styles.dividerPill}>
        <Ionicons name="return-down-back" size={13} color={theme.colors.warning}/>
        <Text style={styles.dividerText}>{label}</Text>
      </View>
      <View style={styles.dividerLine}/>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    topBar: {flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm},
    topButton: {
      minHeight: 36, paddingHorizontal: space.gutterSm, borderRadius: radius.DEFAULT, justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    topButtonPrimary: {backgroundColor: colors.primary},
    topButtonText: {...typography.labelMd, fontSize: 14, color: colors.textBody},
    topButtonPrimaryText: {color: colors.onPrimary, fontFamily: fonts.semibold},
    topTitle: {flex: 1, alignItems: 'center'},
    eyebrow: {...typography.labelCaps, color: colors.safe},
    title: {...typography.headlineSm, color: colors.textPrimary},
    pressed: {opacity: 0.7},
    disabled: {opacity: 0.4},
    content: {paddingHorizontal: space.md, paddingBottom: space.xl},
    stack: {gap: space.md},
    stackSm: {gap: space.sm},
    block: {marginTop: space.lg},
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.gutterSm},
    caps: {...typography.labelCaps, color: colors.textMuted},
    safeCaption: {...typography.labelMd, color: colors.safe},
    inlineLink: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, minHeight: 32},
    inlineLinkText: {...typography.labelMd, fontSize: 13, color: colors.accentText},
    hint: {...typography.bodySm, color: colors.textMuted},
    addButton: {
      height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
      borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong,
    },
    addButtonText: {...typography.titleMd, fontSize: 14, color: colors.accentText},
    divider: {flexDirection: 'row', alignItems: 'center'},
    dividerLine: {flex: 1, height: 1, backgroundColor: colors.border},
    dividerPill: {
      flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginHorizontal: space.sm,
      paddingHorizontal: space.gutterSm, paddingVertical: space.xs + 2, borderRadius: radius.full,
      backgroundColor: colors.warningSoft,
    },
    dividerText: {...typography.labelCaps, color: colors.warning},
    footer: {
      paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm,
      backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
  });
}
