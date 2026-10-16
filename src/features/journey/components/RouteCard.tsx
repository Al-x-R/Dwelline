import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';

import { space, tabularNums, typography, fonts, type AppTheme } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useT } from '../../../i18n';
import { Card } from '../../../components/ui';
import { formatDuration } from '../../../utils/format';
import { travelSummary, type Leg } from '../useJourneyDraft';
import type { RouteNode } from '../useRouteNodes';
import { RETURN_DASH, RouteMini } from './RouteMini';
import { RouteShareModal } from './RouteShareModal';
import type { PosterStatus } from './RoutePoster';

interface Props {
  nodes: RouteNode[];
  legs: Leg[];
  // Poster heading: journey name and dates.
  title: string;
  subtitle?: string;
  badge?: string;
  status?: PosterStatus;
  // Optional external control, e.g. a share button elsewhere on the screen.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Route thumbnail with an outbound / return legend; tapping opens the shareable full-route poster.
export function RouteCard({nodes, legs, title, subtitle, badge, status, open: openProp, onOpenChange}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (value: boolean) => (onOpenChange ? onOpenChange(value) : setOpenState(value));
  const summary = travelSummary(legs);
  const hasReturn = legs.some((l) => l.isReturn);
  const time = (minutes: number | undefined) => (minutes ? formatDuration(minutes, t) : '—');

  return (
    <>
      <Card onPress={() => setOpen(true)} accessibilityLabel={t('route.viewAll')}>
        <View style={styles.header}>
          <Text style={styles.caps}>{t('form.route')}</Text>
          <View style={styles.link}>
            <Ionicons name="share-social-outline" size={14} color={theme.colors.accentText}/>
            <Text style={styles.linkText}>{t('route.viewAll')}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.accentText}/>
          </View>
        </View>

        <RouteMini nodes={nodes}/>

        <View style={styles.legend}>
          <LegendItem label={t('form.outbound')} value={time(summary?.outbound)}/>
          {hasReturn ? <LegendItem label={t('form.inbound')} value={time(summary?.inbound)} isReturn/> : null}
          {summary ? (
            <View style={styles.total}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted}/>
              <Text style={styles.totalText}>{formatDuration(summary.total, t)}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <RouteShareModal
        visible={open}
        title={title}
        subtitle={subtitle}
        badge={badge}
        status={status}
        nodes={nodes}
        legs={legs}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function LegendItem({label, value, isReturn}: { label: string; value: string; isReturn?: boolean }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.legendItem}>
      <Svg width={16} height={2}>
        <Line
          x1={1} y1={1} x2={15} y2={1}
          stroke={isReturn ? theme.colors.warning : theme.colors.primary}
          strokeWidth={2}
          strokeDasharray={isReturn ? RETURN_DASH : undefined}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.gutterSm},
    caps: {...typography.labelCaps, color: colors.textMuted},
    link: {flexDirection: 'row', alignItems: 'center', gap: 4},
    linkText: {...typography.labelMd, color: colors.accentText},
    legend: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xs,
      marginTop: space.gutterSm,
    },
    legendItem: {flexDirection: 'row', alignItems: 'center', gap: space.xs + 2},
    legendLabel: {...typography.bodySm, color: colors.textMuted},
    legendValue: {...typography.labelMd, fontFamily: fonts.semibold, color: colors.textPrimary, ...tabularNums},
    total: {flexDirection: 'row', alignItems: 'center', gap: space.xs, marginLeft: 'auto'},
    totalText: {...typography.labelMd, fontFamily: fonts.bold, color: colors.accentText, ...tabularNums},
  });
}
