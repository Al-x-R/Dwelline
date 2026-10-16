import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { space, tabularNums, typography, fonts, type AppTheme } from '../../../constants/theme';
import { countryCodeToFlag, countryName } from '../../../constants/countries';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useT } from '../../../i18n';
import { Card } from '../../../components/ui';
import { formatDuration } from '../../../utils/format';
import { TRANSPORT_ICONS } from '../journeyUtils';
import { travelSummary, type Leg } from '../useJourneyDraft';

// Per-leg travel time (e.g. bus UA → MD, plane MD → CY) plus outbound / return / total.
export function TravelTimeCard({legs}: { legs: Leg[] }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const summary = travelSummary(legs);
  if (legs.length === 0) return null;

  const place = (code: string | null) => (code ? `${countryCodeToFlag(code)} ${countryName(code, lang)}` : '···');

  return (
    <Card style={styles.card}>
      {legs.map((leg, i) => (
        <React.Fragment key={leg.key}>
          {i > 0 && leg.isReturn && !legs[i - 1].isReturn ? (
            <Text style={styles.groupLabel}>{t('form.inbound')}</Text>
          ) : null}
          <View style={styles.leg}>
            <View style={styles.legIcon}>
              <Ionicons
                name={leg.transport ? TRANSPORT_ICONS[leg.transport] : 'ellipsis-horizontal'}
                size={16}
                color={leg.isReturn ? theme.colors.warning : theme.colors.accentText}
              />
            </View>
            <View style={styles.legBody}>
              <Text style={styles.legRoute} numberOfLines={2}>{place(leg.fromCode)} → {place(leg.toCode)}</Text>
              {leg.transport ? <Text style={styles.legCaption}>{t(`transport.${leg.transport}`)}</Text> : null}
            </View>
            <Text style={[styles.legValue, leg.minutes === null && styles.muted]}>
              {leg.minutes !== null ? formatDuration(leg.minutes, t) : '—'}
            </Text>
          </View>
        </React.Fragment>
      ))}

      {summary ? (
        <View style={styles.summary}>
          <SummaryRow label={t('form.outbound')} value={formatDuration(summary.outbound, t)}/>
          {summary.hasReturn ? <SummaryRow label={t('form.inbound')} value={formatDuration(summary.inbound, t)}/> : null}
          <SummaryRow label={t('form.totalTravel')} value={formatDuration(summary.total, t)} strong/>
        </View>
      ) : null}
      {!summary || !summary.allKnown ? <Text style={styles.hint}>{t('form.onlyKnown')}</Text> : null}
    </Card>
  );
}

function SummaryRow({label, value, strong}: { label: string; value: string; strong?: boolean }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryRow}>
      <Text style={strong ? styles.summaryStrong : styles.summaryLabel}>{label}</Text>
      <Text style={strong ? styles.summaryStrongValue : styles.summaryValue}>{value}</Text>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    card: {gap: space.gutterSm},
    groupLabel: {...typography.labelCaps, color: colors.warning, marginTop: space.xs},
    leg: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    legIcon: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    legBody: {flex: 1},
    legRoute: {...typography.labelMd, fontSize: 13, color: colors.textPrimary},
    legCaption: {...typography.bodySm, fontSize: 12, color: colors.textMuted},
    legValue: {...typography.labelMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
    muted: {color: colors.textMuted, fontFamily: fonts.regular},
    summary: {
      gap: space.sm, paddingTop: space.gutterSm,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    summaryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    summaryLabel: {...typography.bodyMd, color: colors.textMuted},
    summaryValue: {...typography.bodyMd, fontFamily: fonts.semibold, color: colors.textPrimary, ...tabularNums},
    summaryStrong: {...typography.titleMd, color: colors.textPrimary},
    summaryStrongValue: {...typography.titleMd, color: colors.accentText, ...tabularNums},
    hint: {...typography.bodySm, color: colors.textMuted},
  });
}
