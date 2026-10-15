import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormatters } from '../hooks/useFormatters';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useZoneSummary } from '../hooks/useZoneSummary';
import { useT, type TranslationKey } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, IconButton, Pill, Screen, type IconName } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Plans'>;
type PlanId = 'annual' | 'lifetime' | 'monthly';

const FEATURES: { icon: IconName; title: TranslationKey; text: TranslationKey }[] = [
  {icon: 'sparkles-outline', title: 'plans.feature.forecast', text: 'plans.feature.forecastText'},
  {icon: 'earth-outline', title: 'plans.feature.zones', text: 'plans.feature.zonesText'},
  {icon: 'document-text-outline', title: 'plans.feature.pdf', text: 'plans.feature.pdfText'},
  {icon: 'notifications-outline', title: 'plans.feature.alerts', text: 'plans.feature.alertsText'},
  {icon: 'lock-closed-outline', title: 'plans.feature.privacy', text: 'plans.feature.privacyText'},
];

const PLANS: { id: PlanId; title: TranslationKey; price: TranslationKey; sub: TranslationKey; note?: TranslationKey; badge?: TranslationKey }[] = [
  {id: 'annual', title: 'plans.annual', price: 'plans.annualPrice', sub: 'plans.annualSub', note: 'plans.annualTrial', badge: 'plans.best'},
  {id: 'lifetime', title: 'plans.lifetime', price: 'plans.lifetimePrice', sub: 'plans.lifetimeSub', badge: 'plans.once'},
  {id: 'monthly', title: 'plans.monthly', price: 'plans.monthlyPrice', sub: 'plans.monthlySub'},
];

export default function PlansScreen({navigation}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const fmt = useFormatters();
  const {t} = useT();
  const {selectedZone} = useZones();
  const zoneLabel = useZoneLabel();
  const summary = useZoneSummary(selectedZone);
  const [plan, setPlan] = useState<PlanId>('annual');

  const unavailable = () => Alert.alert(t('plans.unavailableTitle'), t('plans.unavailableText'));

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => navigation.goBack()} accessibilityLabel={t('common.close')}/>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{t('plans.eyebrow')}</Text>
          <Text style={styles.headerTitle}>{t('plans.title')}</Text>
        </View>
        <View style={styles.headerSpacer}/>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pill label={t('plans.badge')} tone="safe" icon="diamond-outline" orb outlined caps style={styles.badge}/>
        <Text style={styles.headline}>{t('plans.headline')}</Text>
        <Text style={styles.lead}>{t('plans.text')}</Text>

        <Card tone={summary.tone} style={styles.status}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.safe}/>
          </View>
          <View style={styles.flex}>
            <Text style={styles.statusTitle}>{zoneLabel.short(selectedZone)} {zoneLabel.rule(selectedZone)}</Text>
            <Text style={styles.statusText}>
              {t('plans.statusRemaining')}{' '}
              <Text style={styles.statusStrong}>{fmt.days(summary.daysRemaining)}</Text>
            </Text>
            <Text style={styles.statusText}>{t('plans.statusNoRisk')}</Text>
          </View>
          <Text style={[styles.statusTone, {color: theme.colors.safe}]}>{t(`status.${summary.tone}`)}</Text>
        </Card>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <Card key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={theme.colors.safe}/>
              </View>
              <View style={styles.flex}>
                <Text style={styles.featureTitle}>{t(f.title)}</Text>
                <Text style={styles.featureText}>{t(f.text)}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.chooseRow}>
          <Text style={styles.caps}>{t('plans.choose')}</Text>
          <Text style={styles.noHidden}>{t('plans.noHidden')}</Text>
        </View>

        <View style={styles.plans} accessibilityRole="radiogroup">
          {PLANS.map((p) => {
            const active = plan === p.id;
            return (
              <Pressable
                key={p.id}
                style={({pressed}) => [styles.plan, active && styles.planActive, pressed && styles.pressed]}
                onPress={() => setPlan(p.id)}
                accessibilityRole="radio"
                accessibilityState={{selected: active}}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot}/> : null}
                </View>
                <View style={styles.flex}>
                  <View style={styles.planTop}>
                    <Text style={styles.planTitle}>{t(p.title)}</Text>
                    {p.badge ? <Pill label={t(p.badge)} tone={p.id === 'annual' ? 'safe' : 'warning'} caps/> : null}
                  </View>
                  <Text style={styles.planPrice}>
                    {t(p.price)} <Text style={styles.planSub}>{p.id === 'annual' ? t(p.sub) : ''}</Text>
                  </Text>
                  {p.id !== 'annual' ? <Text style={styles.planSub}>{t(p.sub)}</Text> : null}
                  {p.note ? <Text style={styles.planNote}>{t(p.note)}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label={plan === 'annual' ? t('plans.cta') : t('plans.ctaBuy')} onPress={unavailable}/>
        {plan === 'annual' ? <Text style={styles.ctaSub}>{t('plans.ctaSub')}</Text> : null}
        <View style={styles.secure}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.safe}/>
          <Text style={styles.secureText}>{t('plans.secure')}</Text>
        </View>
        <View style={styles.links}>
          {(['plans.restore', 'plans.terms', 'plans.privacy'] as const).map((key) => (
            <Pressable key={key} onPress={unavailable} hitSlop={6} accessibilityRole="link">
              <Text style={styles.link}>{t(key)}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    header: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, paddingHorizontal: space.md, paddingVertical: space.sm},
    headerText: {flex: 1, alignItems: 'center'},
    headerSpacer: {width: 44},
    eyebrow: {...typography.labelCaps, color: colors.safe},
    headerTitle: {...typography.titleMd, color: colors.textPrimary},
    content: {paddingHorizontal: space.md, paddingBottom: space.lg},
    flex: {flex: 1},
    pressed: {opacity: 0.85},
    badge: {alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: space.sm},
    headline: {...typography.headlineMd, color: colors.textPrimary, textAlign: 'center', marginTop: space.md},
    lead: {...typography.bodyMd, color: colors.textBody, textAlign: 'center', marginTop: space.sm},
    status: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, marginTop: space.lg},
    statusIcon: {
      width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.safeSoft,
    },
    statusTitle: {...typography.titleMd, color: colors.textPrimary},
    statusText: {...typography.bodySm, color: colors.textBody},
    statusStrong: {fontFamily: fonts.bold, color: colors.safe},
    statusTone: {...typography.labelCaps, fontSize: 12},
    features: {gap: space.sm, marginTop: space.md},
    feature: {flexDirection: 'row', gap: space.gutterSm},
    featureIcon: {
      width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    featureTitle: {...typography.titleMd, fontSize: 15, color: colors.textPrimary},
    featureText: {...typography.bodySm, color: colors.textBody, marginTop: 2},
    chooseRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg, marginBottom: space.gutterSm},
    caps: {...typography.labelCaps, color: colors.textMuted},
    noHidden: {...typography.labelMd, color: colors.safe},
    plans: {gap: space.sm},
    plan: {
      flexDirection: 'row', gap: space.gutterSm, padding: space.md, borderRadius: radius.lg,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    planActive: {borderColor: colors.safe, borderTopWidth: 3, backgroundColor: colors.surfaceElevated},
    radio: {
      width: 22, height: 22, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderStrong,
      alignItems: 'center', justifyContent: 'center', marginTop: 2,
    },
    radioActive: {borderColor: colors.safe},
    radioDot: {width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.safe},
    planTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap'},
    planTitle: {...typography.titleMd, color: colors.textPrimary},
    planPrice: {...typography.titleMd, fontFamily: fonts.bold, color: colors.textPrimary, marginTop: space.xs, ...tabularNums},
    planSub: {...typography.bodySm, fontFamily: fonts.regular, color: colors.textMuted},
    planNote: {...typography.bodySm, fontFamily: fonts.semibold, color: colors.safe, marginTop: space.xs},
    footer: {
      paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm, backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    ctaSub: {...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: space.sm},
    secure: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, marginTop: space.sm},
    secureText: {...typography.labelMd, color: colors.textMuted},
    links: {flexDirection: 'row', justifyContent: 'space-around', marginTop: space.sm},
    link: {...typography.labelMd, color: colors.textMuted},
  });
}
