import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { POSTER, radius, space, tabularNums, typography, fonts } from '../../../constants/theme';
import { useT } from '../../../i18n';
import { formatDuration } from '../../../utils/format';
import type { TransportMode } from '../../../types/Trip';
import { TRANSPORT_ICONS } from '../journeyUtils';
import { travelSummary, type Leg } from '../useJourneyDraft';
import type { RouteNode } from '../useRouteNodes';
import { RouteMap } from './RouteMap';

export interface PosterStatus {
  label: string;
  tone: 'safe' | 'warning' | 'danger';
}

interface Props {
  title: string;
  subtitle?: string;
  // Journey length, e.g. "52 дня".
  badge?: string;
  status?: PosterStatus;
  nodes: RouteNode[];
  legs: Leg[];
  // True while the poster is being captured: interactive overlays are hidden.
  capturing?: boolean;
}

// Chips row over the top of the map and the panel's rounded overlap at the bottom.
const CHIPS_HEIGHT = 44;
const PANEL_OVERLAP = 28;

const STATUS_COLOR: Record<PosterStatus['tone'], string> = {
  safe: POSTER.main,
  warning: POSTER.inbound,
  danger: POSTER.danger,
};

// Shareable route card: stylised map on top, journey summary below. Fixed palette (POSTER) in both themes.
export const RoutePoster = forwardRef<View, Props>(function RoutePoster(
  {title, subtitle, badge, status, nodes, legs, capturing},
  ref
) {
  const {t} = useT();
  const summary = travelSummary(legs);
  const hasReturn = legs.some((l) => l.isReturn);
  const countries = new Set(nodes.map((n) => n.code).filter(Boolean)).size;
  const time = (m: number | undefined) => (m ? formatDuration(m, t) : '—');
  const modes = (items: Leg[]) =>
    Array.from(new Set(items.map((l) => l.transport).filter((m): m is TransportMode => !!m)))
      .map((m) => t(`transport.${m}`))
      .join(' + ') || undefined;
  const legPairs = nodes.slice(0, -1).map((n, i) => ({from: n, to: nodes[i + 1]}));

  return (
    <View ref={ref} collapsable={false} style={styles.poster}>
      <View style={styles.mapArea}>
        <RouteMap nodes={nodes} insetTop={CHIPS_HEIGHT} insetBottom={PANEL_OVERLAP} hideDetails={capturing}/>
        <View style={styles.chips} pointerEvents="none">
          <View style={styles.chip}>
            <View style={[styles.chipDot, {backgroundColor: POSTER.outbound}]}/>
            <Text style={styles.chipText}>
              {t('route.countries', {count: countries})} · {t('route.legs', {count: legs.length})}
            </Text>
          </View>
          {status ? (
            <View style={styles.chip}>
              <View style={[styles.chipDot, {backgroundColor: STATUS_COLOR[status.tone]}]}/>
              <Text style={[styles.chipText, {color: STATUS_COLOR[status.tone]}]} numberOfLines={1}>{status.label}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.brandRow}>
          <View style={styles.brand}>
            <LinearGradient colors={[POSTER.outbound, POSTER.main]} start={{x: 0, y: 1}} end={{x: 1, y: 0}} style={styles.logo}>
              <Ionicons name="navigate" size={11} color={POSTER.canvas}/>
            </LinearGradient>
            <Text style={styles.brandText}>DWELLINE</Text>
          </View>
          <View style={styles.eyebrow}>
            <Text style={styles.eyebrowText}>{t('route.posterEyebrow')}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {legPairs.length > 0 ? (
          <View style={styles.legs}>
            {legPairs.map(({from, to}) => {
              const leg = from.leg;
              const color = leg?.transport ? POSTER.transport[leg.transport] : leg?.isReturn ? POSTER.inbound : POSTER.outbound;
              return (
                <View key={from.key} style={styles.legChip}>
                  <Ionicons name={leg?.transport ? TRANSPORT_ICONS[leg.transport] : 'ellipsis-horizontal'} size={13} color={color}/>
                  <Text style={styles.legRoute} numberOfLines={1}>{from.code} → {to.code}</Text>
                  <Text style={[styles.legTime, leg?.minutes == null && styles.legTimeEmpty]}>
                    {time(leg?.minutes ?? undefined)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.stats}>
          <Stat label={t('form.outbound')} value={time(summary?.outbound)} caption={modes(legs.filter((l) => !l.isReturn))} color={POSTER.outbound}/>
          {hasReturn ? (
            <Stat label={t('form.inbound')} value={time(summary?.inbound)} caption={modes(legs.filter((l) => l.isReturn))} color={POSTER.inbound}/>
          ) : null}
          <Stat label={t('route.inTransit')} value={time(summary?.total)} color={POSTER.main} highlight/>
        </View>
      </View>
    </View>
  );
});

function Stat({label, value, caption, color, highlight}: {
  label: string; value: string; caption?: string; color: string; highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <View style={styles.statLabelRow}>
        <View style={[styles.chipDot, {backgroundColor: color}]}/>
        <Text style={[styles.statLabel, highlight && {color}]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[styles.statValue, highlight && {color}]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {caption ? <Text style={styles.statCaption} numberOfLines={1}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {flex: 1, backgroundColor: POSTER.canvas},
  mapArea: {flex: 1, minHeight: 200},
  chips: {position: 'absolute', top: space.sm, left: space.md, right: space.md, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm},
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.full, backgroundColor: POSTER.label, borderWidth: 1, borderColor: POSTER.labelBorder,
  },
  chipDot: {width: 6, height: 6, borderRadius: 3},
  chipText: {...typography.labelMd, fontSize: 11, color: POSTER.textMuted},
  panel: {
    marginTop: -PANEL_OVERLAP, paddingHorizontal: space.md + 4, paddingTop: space.md + 2, paddingBottom: space.md,
    borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: POSTER.panel,
    borderTopWidth: 1, borderColor: POSTER.chipBorder, gap: space.gutterSm,
  },
  brandRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  brand: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  logo: {width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center'},
  brandText: {fontFamily: fonts.bold, fontSize: 11, letterSpacing: 3, color: POSTER.textMuted},
  eyebrow: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1,
    borderColor: POSTER.eyebrowBorder, backgroundColor: POSTER.eyebrow,
  },
  eyebrowText: {...typography.labelCaps, fontSize: 10, color: POSTER.outbound},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm},
  title: {flex: 1, fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, color: POSTER.text},
  badge: {
    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
    borderColor: POSTER.mainBorder, backgroundColor: POSTER.mainSoft,
  },
  badgeText: {fontFamily: fonts.bold, fontSize: 12, color: POSTER.main, ...tabularNums},
  subtitle: {...typography.bodySm, color: POSTER.textMuted, marginTop: -space.sm + 2, ...tabularNums},
  legs: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm},
  legChip: {
    flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.md,
    backgroundColor: POSTER.panelLight, borderWidth: 1, borderColor: POSTER.chipBorder,
  },
  legRoute: {...typography.labelMd, color: POSTER.textMuted, flex: 1, letterSpacing: 0.6},
  legTime: {...typography.labelMd, fontFamily: fonts.bold, color: POSTER.text, ...tabularNums},
  legTimeEmpty: {color: POSTER.textFaint, fontFamily: fonts.regular},
  stats: {flexDirection: 'row', gap: space.sm},
  stat: {
    flex: 1, gap: 2, padding: 10, borderRadius: radius.md, backgroundColor: POSTER.stat,
    borderWidth: 1, borderColor: POSTER.chipBorder,
  },
  statHighlight: {backgroundColor: POSTER.statHighlight, borderColor: POSTER.mainBorder},
  statLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  statLabel: {...typography.labelCaps, fontSize: 10, color: POSTER.textMuted},
  statValue: {fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: POSTER.text, ...tabularNums},
  statCaption: {...typography.bodySm, fontSize: 10, lineHeight: 13, color: POSTER.textFaint},
});
