import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../../constants/theme';
import { countryName } from '../../constants/countries';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useFormatters } from '../../hooks/useFormatters';
import { useT } from '../../i18n';
import type { Journey } from '../../types/Journey';
import type { Trip } from '../../types/Trip';
import { Pill, type Tone } from '../../components/ui';
import { TRANSPORT_ICONS, journeySpan, journeyState, uniqueFlags } from './journeyUtils';

interface Props {
  journey: Journey;
  trips: Trip[]; // this journey's segments, sorted by date
  // Right-hand caption of the bottom row, e.g. "Schengen 15/90", "Outside 180-day window".
  footnote?: { label: string; tone: Tone };
  onPress: () => void;
}

export function JourneyCard({journey, trips, footnote, onPress}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t, lang} = useT();

  const span = journeySpan(trips);
  const state = journeyState(span);
  const flags = uniqueFlags(trips).slice(0, 3);
  const dates = span
    ? `${fmt.shortYear(span.start)} — ${span.isOpen ? t('common.now') : fmt.shortYear(span.end)}`
    : t('journey.noSegments');
  const chain = trips.map((tr) => countryName(tr.countryCode, lang));
  const firstTransport = trips.find((tr) => tr.transportMode)?.transportMode;

  return (
    <Pressable
      style={({pressed}) => [styles.card, state === 'active' && styles.cardActive, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${journey.name}, ${dates}`}
    >
      <View style={styles.top}>
        <View style={styles.flags}>
          {flags.length === 0 ? <Text style={styles.flag}>🧭</Text> : null}
          {flags.map((f, i) => (
            <Text key={f} style={[styles.flag, i > 0 && styles.flagOverlap]}>{f}</Text>
          ))}
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{journey.name}</Text>
          <Text style={styles.dates} numberOfLines={2}>{dates}</Text>
        </View>
        <View style={styles.trailing}>
          {span ? (
            <Text style={[styles.days, state === 'active' && {color: theme.colors.safe}]}>
              {t('common.days', {count: span.days})}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted}/>
        </View>
      </View>

      {chain.length > 0 ? (
        <View style={styles.bottom}>
          <Ionicons
            name={firstTransport ? TRANSPORT_ICONS[firstTransport] : 'navigate-outline'}
            size={16}
            color={theme.colors.textMuted}
          />
          <Text style={styles.chain} numberOfLines={1}>{chain.join(' → ')}</Text>
          {state === 'planned' ? <Pill label={t('history.planned')} tone="primary"/> : null}
          {footnote && state !== 'planned' ? (
            <Text style={[styles.footnote, {color: footnote.tone === 'neutral' ? theme.colors.textMuted : theme.colors.textPrimary}]}>
              {footnote.label}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
      padding: space.md, ...elevation.card,
    },
    cardActive: {borderColor: colors.safeSoft},
    pressed: {opacity: 0.85, transform: [{scale: 0.98}]},
    top: {flexDirection: 'row', alignItems: 'flex-start', gap: space.gutterSm},
    flags: {flexDirection: 'row', width: 56},
    flag: {fontSize: 26},
    flagOverlap: {marginLeft: -12},
    body: {flex: 1},
    name: {...typography.titleMd, color: colors.textPrimary},
    dates: {...typography.bodySm, color: colors.textMuted, marginTop: 2, ...tabularNums},
    trailing: {flexDirection: 'row', alignItems: 'center', gap: space.xs},
    days: {...typography.titleMd, fontSize: 15, color: colors.textPrimary, ...tabularNums},
    bottom: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.gutterSm, paddingTop: space.gutterSm,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    chain: {...typography.bodySm, color: colors.textBody, flex: 1},
    footnote: {...typography.labelMd, fontFamily: fonts.bold},
  });
}
