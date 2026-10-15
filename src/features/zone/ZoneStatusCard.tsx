import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, tabularNums, typography, fonts, type AppTheme } from '../../constants/theme';
import type { ZoneConfig } from '../../constants/zones';
import type { ZoneTone } from '../../core/zoneAnalytics';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useZoneLabel } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { Card, FlagBadge, ProgressBar, toneColors } from '../../components/ui';

interface Props {
  zone: ZoneConfig;
  daysUsed: number;
  maxDays: number;
  tone: ZoneTone;
  // How many of the used days fall on this particular trip.
  daysInJourney?: number;
  onPress?: () => void;
}

export function ZoneStatusCard({zone, daysUsed, maxDays, tone, daysInJourney, onPress}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const zoneLabel = useZoneLabel();
  const fg = toneColors(theme.colors, tone).fg;
  const remaining = Math.max(0, maxDays - daysUsed);

  return (
    <Card onPress={onPress}>
      <View style={styles.top}>
        <FlagBadge flag={zone.flag} size={36}/>
        <Text style={styles.name} numberOfLines={1}>{zoneLabel.name(zone)}</Text>
        <Text style={styles.value}>
          <Text style={[styles.used, {color: daysUsed > 0 ? fg : theme.colors.textPrimary}]}>{daysUsed}</Text>
          {' '}/ {fmtDays(t, maxDays)}
        </Text>
      </View>
      <View style={styles.bar}>
        <ProgressBar progress={daysUsed / maxDays} color={fg} thumb/>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.muted}>
          {t('journey.remainingLabel')} <Text style={styles.strong}>{t('common.days', {count: remaining})}</Text>
        </Text>
        {daysInJourney !== undefined ? (
          <Text style={styles.caption}>• {t('journey.ofThemInTrip', {count: daysInJourney})}</Text>
        ) : null}
      </View>
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
    muted: {...typography.bodyMd, color: colors.textBody},
    strong: {fontFamily: fonts.bold, color: colors.textPrimary},
    caption: {...typography.bodySm, color: colors.textMuted, flexShrink: 1, textAlign: 'right'},
  });
}
