import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { radius, space, tabularNums, typography, fonts, type AppTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { detectDeviceLanguage, useT, type TranslationKey } from '../i18n';
import { LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_NATIVE_NAMES } from '../i18n/types';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { Button, Card, ListRow, Pill, ProgressDial, Screen, SectionHeader, toneColors, toneGradient, type IconName, type Tone } from '../components/ui';
import { DocumentsEditor } from '../components/app/DocumentsEditor';
import { ThemeOptions } from '../components/app/ThemeOptions';
import { ZoneToggleList } from '../components/app/ZoneToggleList';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = 4;
const DEMO_USED = 64;
const DEMO_MAX = 90;

const FEATURES: { icon: IconName; tone: Tone; title: TranslationKey; text: TranslationKey }[] = [
  {icon: 'scale-outline', tone: 'primary', title: 'onboarding.f1', text: 'onboarding.f1Text'},
  {icon: 'earth-outline', tone: 'safe', title: 'onboarding.f2', text: 'onboarding.f2Text'},
  {icon: 'flash-outline', tone: 'warning', title: 'onboarding.f3', text: 'onboarding.f3Text'},
];

export default function OnboardingScreen({navigation}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // First launch: take the UI language from the system.
    if (!useSettingsStore.getState().onboardingDone) setLanguage(detectDeviceLanguage());
  }, [setLanguage]);

  const finish = () => {
    if (onboardingDone) {
      navigation.goBack();
      return;
    }
    setOnboardingDone(true);
    navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());

  return (
    <Screen glow="primary" edges={['top', 'left', 'right']}>
      <View style={styles.top}>
        <Pill label={t('onboarding.badge')} tone="safe" orb caps style={styles.badge}/>
        <Pressable onPress={finish} hitSlop={8} accessibilityRole="button">
          <Text style={styles.skip}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>
      <View style={styles.progress}>
        {Array.from({length: STEPS}, (_, i) => (
          <View key={i} style={[styles.progressSegment, i <= step && styles.progressActive]}/>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <>
            <LinearGradient
              colors={theme.dark ? ['#1A2030', '#10261F'] : ['#FFFFFF', '#ECFDF5']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.demo}
            >
              <View style={styles.demoChips}>
                <View style={styles.demoChip}>
                  <Ionicons name="globe-outline" size={16} color={theme.colors.accentText}/>
                  <Text style={styles.demoChipText}>{t('onboarding.demoZones')}</Text>
                </View>
                <View style={styles.demoChip}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textMuted}/>
                  <Text style={styles.demoChipText}>{t('onboarding.demoWindow')}</Text>
                </View>
              </View>
              <View style={styles.demoDial}>
                <ProgressDial progress={DEMO_USED / DEMO_MAX} size={200} colors={toneGradient(theme, 'primary')} showThumb={false}>
                  <Text style={styles.demoValue}>{DEMO_USED}</Text>
                  <Text style={styles.demoOf}>{t('onboarding.demoOf')}</Text>
                  <Pill label={t('onboarding.demoFree')} tone="safe" orb caps style={styles.demoPill}/>
                </ProgressDial>
              </View>
              <Pill label={t('onboarding.demoProtection')} tone="safe" icon="shield-checkmark-outline" style={styles.center}/>
              <View style={styles.demoEntry}>
                <View style={styles.demoEntryIcon}>
                  <Ionicons name="airplane" size={20} color={theme.colors.safe}/>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.demoEntryTitle}>{t('onboarding.demoEntry')}</Text>
                  <Text style={styles.muted}>{t('onboarding.demoEntryHint')}</Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.safe}/>
              </View>
            </LinearGradient>

            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.body}>{t('onboarding.text')}</Text>

            <View style={styles.features}>
              {FEATURES.map((f) => (
                <Card key={f.title} style={styles.feature}>
                  <View style={[styles.featureIcon, {backgroundColor: toneColors(theme.colors, f.tone).bg}]}>
                    <Ionicons name={f.icon} size={22} color={toneColors(theme.colors, f.tone).fg}/>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.featureTitle}>{t(f.title)}</Text>
                    <Text style={styles.muted}>{t(f.text)}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.title}>{t('onboarding.docsTitle')}</Text>
            <Text style={styles.body}>{t('onboarding.docsText')}</Text>
            <Card padded={false} style={styles.group}>
              <DocumentsEditor/>
            </Card>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>{t('onboarding.zonesTitle')}</Text>
            <Text style={styles.body}>{t('onboarding.zonesText')}</Text>
            <Card padded={false} style={styles.group}>
              <ZoneToggleList/>
            </Card>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.title}>{t('onboarding.prefsTitle')}</Text>
            <Text style={styles.body}>{t('onboarding.prefsText')}</Text>
            <SectionHeader title={t('settings.language')}/>
            <Card padded={false} style={styles.group}>
              {LANGUAGES.map((code, i) => (
                <ListRow
                  key={code}
                  title={`${LANGUAGE_FLAGS[code]}  ${LANGUAGE_NATIVE_NAMES[code]}`}
                  onPress={() => setLanguage(code)}
                  trailing={
                    <Ionicons
                      name={code === lang ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={code === lang ? theme.colors.safe : theme.colors.textMuted}
                    />
                  }
                  last={i === LANGUAGES.length - 1}
                />
              ))}
            </Card>
            <SectionHeader title={t('settings.theme')}/>
            <Card padded={false} style={styles.group}>
              <ThemeOptions/>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          label={step === 0 ? t('onboarding.start') : step === STEPS - 1 ? t('onboarding.finish') : t('common.next')}
          icon="arrow-forward"
          iconPosition="right"
          onPress={next}
        />
        <View style={styles.privacy}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textMuted}/>
          <Text style={styles.privacyText}>{t('onboarding.privacy')}</Text>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingTop: space.sm},
    badge: {paddingHorizontal: space.gutterSm, paddingVertical: space.xs + 2},
    skip: {...typography.bodyMd, color: colors.textMuted},
    progress: {flexDirection: 'row', gap: space.sm, paddingHorizontal: space.md, marginTop: space.gutterSm},
    progressSegment: {flex: 1, height: 4, borderRadius: radius.full, backgroundColor: colors.surfaceHighest},
    progressActive: {backgroundColor: colors.accentText},
    content: {paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.lg},
    flex: {flex: 1},
    center: {alignSelf: 'center'},
    demo: {borderRadius: radius.xl, padding: space.md, borderWidth: 1, borderColor: colors.border, gap: space.md},
    demoChips: {flexDirection: 'row', gap: space.sm},
    demoChip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.gutterSm,
      borderRadius: radius.full, backgroundColor: colors.surfaceElevated,
    },
    demoChipText: {...typography.labelMd, color: colors.textBody, flexShrink: 1},
    demoDial: {alignItems: 'center'},
    demoValue: {...typography.displayHero, color: colors.textPrimary, ...tabularNums},
    demoOf: {...typography.bodyMd, color: colors.textBody, marginTop: -space.sm},
    demoPill: {alignSelf: 'center', marginTop: space.xs},
    demoEntry: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, padding: space.gutterSm,
      borderRadius: radius.lg, backgroundColor: colors.surface,
    },
    demoEntryIcon: {
      width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.safeSoft,
    },
    demoEntryTitle: {...typography.titleMd, color: colors.textPrimary},
    muted: {...typography.bodySm, color: colors.textMuted},
    title: {...typography.displayLg, color: colors.textPrimary, marginTop: space.lg},
    body: {...typography.bodyMd, color: colors.textBody, marginTop: space.sm},
    features: {gap: space.gutterSm, marginTop: space.lg},
    feature: {flexDirection: 'row', alignItems: 'center', gap: space.md},
    featureIcon: {width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center'},
    featureTitle: {...typography.titleMd, color: colors.textPrimary},
    group: {paddingHorizontal: space.md, marginTop: space.md},
    footer: {paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm},
    privacy: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs + 2, marginTop: space.gutterSm},
    privacyText: {...typography.labelMd, fontFamily: fonts.regular, color: colors.textMuted},
  });
}
