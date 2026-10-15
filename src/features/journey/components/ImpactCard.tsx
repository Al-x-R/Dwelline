import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../../../constants/theme';
import type { ZoneTone } from '../../../core/zoneAnalytics';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useT } from '../../../i18n';
import { Card, Pill, ProgressDial, toneColors, toneGradient } from '../../../components/ui';

export interface ImpactRow {
  key: string;
  label: string;
  color: string;
  value: string;
}

interface Props {
  title: string;
  tone: ZoneTone;
  used: number;
  max: number;
  remaining: string;
  windowReset: string | null;
  rows: ImpactRow[];
  // No limit for the user's documents: only the per-zone split is shown.
  free?: boolean;
}

// "Limit impact": how many days the route takes and how they split across zones.
export function ImpactCard({title, tone, used, max, remaining, windowReset, rows, free}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  const fg = toneColors(theme.colors, tone).fg;
  const percent = Math.min(999, Math.round((used / max) * 100));

  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={22} color={fg}/>
        <Text style={styles.title}>{title}</Text>
        {free ? <Pill label={t('zone.ruleFree')} tone="safe" caps/> : <Pill label={t(`status.${tone}`)} tone={tone} orb caps/>}
      </View>

      {free ? null : (
        <View style={styles.main}>
          <ProgressDial progress={used / max} size={84} strokeWidth={8} colors={toneGradient(theme, tone)} showThumb={false}>
            <Text style={styles.percent}>{percent}%</Text>
          </ProgressDial>
          <View style={styles.usedBox}>
            <Text style={styles.caps}>{t('form.used')}</Text>
            <Text style={[styles.used, {color: fg}]}>{used}</Text>
            <Text style={styles.muted}>{t('form.ofMax', {max})}</Text>
          </View>
          <View style={styles.side}>
            <View style={styles.sideRow}>
              <Text style={styles.muted}>{t('form.willRemain')}</Text>
              <Text style={styles.sideValue}>{remaining}</Text>
            </View>
            {windowReset ? (
              <View style={styles.sideRow}>
                <Text style={styles.muted}>{t('form.windowReset')}</Text>
                <Text style={styles.sideValue}>{windowReset}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {rows.length > 0 ? (
        <View style={styles.rows}>
          <Text style={styles.caps}>{t('form.distribution')}</Text>
          {rows.map((row) => (
            <View key={row.key} style={styles.row}>
              <View style={[styles.dot, {backgroundColor: row.color}]}/>
              <Text style={styles.rowLabel} numberOfLines={1}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    header: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md},
    title: {...typography.headlineSm, color: colors.textPrimary, flex: 1},
    main: {flexDirection: 'row', alignItems: 'center', gap: space.md},
    percent: {...typography.titleMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
    usedBox: {gap: 2},
    caps: {...typography.labelCaps, color: colors.textMuted},
    used: {...typography.headlineXl, ...tabularNums},
    muted: {...typography.bodySm, color: colors.textMuted},
    side: {flex: 1, gap: space.sm},
    sideRow: {gap: 2},
    sideValue: {...typography.titleMd, fontSize: 14, color: colors.textPrimary, ...tabularNums},
    rows: {
      marginTop: space.md, padding: space.gutterSm, gap: space.sm, borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
    },
    row: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    dot: {width: 8, height: 8, borderRadius: radius.full},
    rowLabel: {...typography.bodySm, color: colors.textBody, flex: 1},
    rowValue: {...typography.labelMd, fontFamily: fonts.bold, color: colors.textPrimary, ...tabularNums},
  });
}
