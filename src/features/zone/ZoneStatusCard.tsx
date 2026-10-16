import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, tabularNums, typography, fonts, type AppTheme } from '../../constants/theme';
import type { ZoneConfig } from '../../constants/zones';
import type { StayRules } from '../../core/schengenCalculator';
import type { ZoneTone } from '../../core/zoneAnalytics';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { Card, FlagBadge, Pill, ProgressBar, toneColors } from '../../components/ui';

interface Props {
  zone: ZoneConfig;
  daysUsed: number;
  maxDays: number;
  tone: ZoneTone;
  // What's left under every rule; defaults to maxDays - daysUsed.
  daysRemaining?: number;
  // Extra rule that is stricter than the main one right now.
  limitedBy?: StayRules | null;
  // How many of the used days fall on this particular trip.
  daysInJourney?: number;
  // No limit for the user's documents: show the days without a cap.
  free?: boolean;
  onPress?: () => void;
}

export function ZoneStatusCard({zone, daysUsed, maxDays, tone, daysRemaining, limitedBy, daysInJourney, free, onPress}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const zoneLabel = useZoneLabel();
  const fg = toneColors(theme.colors, tone).fg;
  const remaining = daysRemaining ?? Math.max(0, maxDays - daysUsed);
  const limitedByText = free ? null : zoneLabel.limitedBy(limitedBy);

  return (
    <Card onPress={onPress}>
      <View style={styles.top}>
        <FlagBadge flag={zone.flag} size={36}/>
        <Text style={styles.name} numberOfLines={1}>{zoneLabel.name(zone)}</Text>
        {free ? (
          <Pill label={t('zone.ruleFree')} tone="safe" caps/>
        ) : (
          <Text style={styles.value}>
            <Text style={[styles.used, {color: daysUsed > 0 ? fg : theme.colors.textPrimary}]}>{daysUsed}</Text>
            {' '}/ {fmtDays(t, maxDays)}
          </Text>
        )}
      </View>
      {free ? null : (
        <View style={styles.bar}>
          <ProgressBar progress={daysUsed / maxDays} color={fg} thumb/>
        </View>
      )}
      <View style={[styles.bottom, free && styles.bottomFree]}>
        <Text style={styles.muted}>
          {free
            ? t('zoneSheet.freeForYou')
            : <>{t('journey.remainingLabel')} <Text style={styles.strong}>{t('common.days', {count: remaining})}</Text></>}
        </Text>
        {daysInJourney !== undefined ? (
          <Text style={styles.caption}>• {t('journey.ofThemInTrip', {count: daysInJourney})}</Text>
        ) : null}
      </View>
      {limitedByText ? <Text style={styles.limited}>{limitedByText}</Text> : null}
    </Card>
  );
}

function fmtDays(t: ReturnType<typeof useT>['t'], n: number) {
  return t('common.days', {count: n});
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    top: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    name: {...typography.titleMd, color: colors.textPrimary, flex: 1},
    value: {...typography.bodyMd, color: colors.textMuted, ...tabularNums},
    used: {...typography.headlineSm, fontFamily: fonts.bold},
    bar: {marginVertical: space.md},
    bottom: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm},
    bottomFree: {marginTop: space.gutterSm},
    muted: {...typography.bodyMd, color: colors.textBody},
    strong: {fontFamily: fonts.bold, color: colors.textPrimary},
    caption: {...typography.bodySm, color: colors.textMuted, flexShrink: 1, textAlign: 'right'},
    limited: {...typography.bodySm, color: colors.warning, marginTop: space.xs},
  });
}
