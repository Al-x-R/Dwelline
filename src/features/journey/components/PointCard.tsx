import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, fonts, type AppTheme } from '../../../constants/theme';
import type { TransportMode } from '../../../types/Trip';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useT } from '../../../i18n';
import { Card, IconButton, Pill, Toggle, type Tone } from '../../../components/ui';
import type { PointRole } from '../useJourneyDraft';
import { DateTimeTile } from './DateTimeTile';
import { TransportPicker } from './TransportPicker';
import { TRANSPORT_ICONS } from '../journeyUtils';

export interface PointCardProps {
  index: number;
  role: PointRole;
  flag: string | null;
  countryLabel: string | null;
  zoneTag: { label: string; tone: Tone };
  zoneCaption: string;
  arrivalDate: string | null;
  arrivalTime?: string;
  departureDate: string | null;
  departureTime?: string;
  isLast: boolean;
  hasOutgoing: boolean;
  transportMode?: TransportMode;
  stopover: string | null;
  stayLabel: string | null;
  isTurnaround: boolean;
  canTurnaround: boolean;
  isFinal: boolean;
  canFinal: boolean;
  canRemove: boolean;
  onPickCountry: () => void;
  onPickArrivalDate: () => void;
  onPickArrivalTime: () => void;
  onPickDepartureDate?: () => void;
  onPickDepartureTime: () => void;
  onTransport: (mode: TransportMode | undefined) => void;
  onToggleTurnaround: (on: boolean) => void;
  onToggleFinal: (on: boolean) => void;
  onClearExit: () => void;
  // Border crossing row under the departure, when it applies.
  border?: React.ReactNode;
  onRemove: () => void;
}

export function PointCard(props: PointCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const {index, role, countryLabel, isLast} = props;
  const title = countryLabel
    ? role === 'main'
      ? t('form.mainTitle', {country: countryLabel})
      : role === 'return'
        ? `${t('journey.role.return')}: ${countryLabel}`
        : role === 'final'
          ? t('form.finalTitle', {country: countryLabel})
          : t('form.transitTitle', {country: countryLabel})
    : t('form.pointTitle', {n: index + 1});
  const isMain = role === 'main';

  return (
    <Card style={[styles.card, props.isTurnaround && styles.turnaround]}>
      <View style={styles.header}>
        <View style={[styles.badge, isMain && styles.badgeMain]}>
          <Text style={[styles.badgeText, isMain && styles.badgeTextMain]}>{index + 1}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Pill label={props.zoneTag.label} tone={props.zoneTag.tone} caps/>
      </View>

      <Pressable
        style={({pressed}) => [styles.country, pressed && styles.pressed]}
        onPress={props.onPickCountry}
        accessibilityRole="button"
        accessibilityLabel={countryLabel ?? t('form.chooseCountry')}
      >
        <Text style={styles.flag}>{props.flag ?? '🏳️'}</Text>
        <View style={styles.countryText}>
          <Text style={[styles.countryName, !countryLabel && styles.placeholder]}>
            {countryLabel ?? t('form.chooseCountry')}
          </Text>
          <Text style={styles.caption}>{props.zoneCaption}</Text>
        </View>
        {props.canRemove ? (
          <IconButton
            icon="trash-outline"
            size="sm"
            tone="danger"
            onPress={props.onRemove}
            accessibilityLabel={t('form.removePoint', {n: index + 1})}
          />
        ) : (
          <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted}/>
        )}
      </Pressable>

      <View style={styles.tiles}>
        <DateTimeTile
          label={t('form.arrival')}
          icon="airplane-outline"
          date={props.arrivalDate}
          time={props.arrivalTime}
          datePlaceholder={t('form.date')}
          timePlaceholder={t('form.time')}
          onPressDate={props.onPickArrivalDate}
          onPressTime={props.onPickArrivalTime}
        />
        {props.isFinal ? null : <DateTimeTile
          label={isLast ? t('form.plannedExit') : t('form.departure')}
          icon={isLast ? 'calendar-outline' : 'arrow-forward-circle-outline'}
          accent="warning"
          date={props.departureDate}
          time={props.departureTime}
          datePlaceholder={isLast ? t('form.date') : '—'}
          timePlaceholder={t('form.time')}
          onPressDate={props.onPickDepartureDate}
          onPressTime={props.hasOutgoing || isLast ? props.onPickDepartureTime : undefined}
        />}
      </View>

      {props.border}

      {isLast && !props.isFinal && props.departureDate ? (
        <Pressable onPress={props.onClearExit} hitSlop={6} style={styles.inlineLink} accessibilityRole="button">
          <Ionicons name="close-circle-outline" size={14} color={theme.colors.accentText}/>
          <Text style={styles.inlineLinkText}>{t('form.keepOpen')}</Text>
        </Pressable>
      ) : null}

      {props.hasOutgoing ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('form.transportTo')}</Text>
          <TransportPicker value={props.transportMode} onChange={props.onTransport}/>
        </View>
      ) : null}

      {props.stopover || props.transportMode ? (
        <View style={styles.strip}>
          {props.stopover ? (
            <>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted}/>
              <Text style={styles.stripText}>{t('form.stopover', {duration: props.stopover})}</Text>
            </>
          ) : null}
          {props.transportMode && props.hasOutgoing ? (
            <>
              <Text style={styles.stripLabel}>{t('form.nextBy')}</Text>
              <Ionicons name={TRANSPORT_ICONS[props.transportMode]} size={14} color={theme.colors.safe}/>
              <Text style={styles.stripText}>{t(`transport.${props.transportMode}`)}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {props.stayLabel ? (
        <View style={styles.stay}>
          <Text style={styles.caption}>{t('form.stay')}</Text>
          <Text style={styles.stayValue}>{props.stayLabel}</Text>
        </View>
      ) : null}

      {props.canTurnaround ? (
        <View style={styles.turnRow}>
          <View style={styles.countryText}>
            <Text style={styles.turnTitle}>{t('form.turnaround')}</Text>
            <Text style={styles.caption}>{t('form.turnaroundHint')}</Text>
          </View>
          <Toggle value={props.isTurnaround} onValueChange={props.onToggleTurnaround} accessibilityLabel={t('form.turnaround')}/>
        </View>
      ) : null}

      {props.canFinal ? (
        <View style={styles.turnRow}>
          <View style={styles.countryText}>
            <Text style={styles.turnTitle}>{t('form.finalPoint')}</Text>
            <Text style={styles.caption}>{t('form.finalPointHint')}</Text>
          </View>
          <Toggle value={props.isFinal} onValueChange={props.onToggleFinal} accessibilityLabel={t('form.finalPoint')}/>
        </View>
      ) : null}
    </Card>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    card: {gap: space.gutterSm},
    turnaround: {borderColor: colors.warning},
    header: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    badge: {
      width: 26, height: 26, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceHighest,
    },
    badgeMain: {backgroundColor: colors.safe},
    badgeText: {...typography.labelSm, color: colors.textPrimary},
    badgeTextMain: {color: colors.onSafe},
    title: {...typography.headlineSm, color: colors.textPrimary, flex: 1},
    country: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, padding: space.gutterSm,
      borderRadius: radius.md, backgroundColor: colors.surfaceElevated,
    },
    pressed: {opacity: 0.75},
    flag: {fontSize: 28},
    countryText: {flex: 1},
    countryName: {...typography.titleMd, color: colors.textPrimary},
    placeholder: {color: colors.textMuted},
    caption: {...typography.bodySm, color: colors.textMuted},
    tiles: {flexDirection: 'row', gap: space.sm},
    section: {gap: space.sm},
    label: {...typography.labelCaps, color: colors.textMuted},
    strip: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xs + 2, paddingVertical: space.sm,
      paddingHorizontal: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.canvas,
    },
    stripText: {...typography.labelMd, color: colors.textBody, marginRight: space.sm},
    stripLabel: {...typography.labelCaps, color: colors.textMuted},
    stay: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm},
    stayValue: {...typography.labelMd, fontFamily: fonts.bold, color: colors.textPrimary},
    turnRow: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.gutterSm,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    turnTitle: {...typography.titleMd, fontSize: 14, color: colors.textPrimary},
    inlineLink: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, minHeight: 32},
    inlineLinkText: {...typography.labelMd, fontSize: 13, color: colors.accentText},
  });
}
