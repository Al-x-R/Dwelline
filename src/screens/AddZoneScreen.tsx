import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { space, typography, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { NO_ZONE } from '../constants/zones';
import type { StayRuleKind } from '../core/schengenCalculator';
import { makeId } from '../features/journey/useJourneyDraft';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useZoneLabel, useZones, zoneIdForCountry } from '../hooks/useZones';
import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { useZonesStore } from '../store/zonesStore';
import { Button, Card, FieldLabel, InfoBanner, Screen, ScreenHeader, SegmentedControl, SelectField, TextField } from '../components/ui';
import { CountryPickerSheet } from '../components/app/CountryPickerSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'AddZone'>;

const MAX_DAYS = 3650;

// Digits only; empty or zero means "not set".
function parseDays(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_DAYS) : 0;
}

export default function AddZoneScreen({navigation}: Props) {
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const {allZones} = useZones();
  const zoneLabel = useZoneLabel();
  const addCustomZone = useZonesStore((s) => s.addCustomZone);
  const setSelectedZoneId = useSettingsStore((s) => s.setSelectedZoneId);

  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<StayRuleKind>('per_visit');
  const [maxStayText, setMaxStayText] = useState('30');
  const [windowText, setWindowText] = useState('180');
  const [picker, setPicker] = useState(false);

  const maxStay = parseDays(maxStayText);
  const windowDays = parseDays(windowText);
  const perVisit = ruleType === 'per_visit';
  const windowTooSmall = !perVisit && maxStay > 0 && windowDays > 0 && windowDays < maxStay;

  const existingZone = code ? allZones.find((z) => z.id === zoneIdForCountry(code, allZones) && z.id !== NO_ZONE) : undefined;
  const canSave = !!code && maxStay > 0 && (perVisit || (windowDays > 0 && !windowTooSmall));

  const save = async () => {
    if (!code) return;
    const id = `custom_${code.toLowerCase()}_${makeId()}`;
    await addCustomZone({
      id,
      name: name.trim() || countryName(code, lang),
      flag: countryCodeToFlag(code),
      ruleType,
      ...(perVisit ? {maxStayDays: maxStay} : {windowSizeDays: windowDays, maxStayDays: maxStay}),
      isMultiCountry: false,
      countryCodes: [code],
    });
    setSelectedZoneId(id);
    navigation.goBack();
  };

  const daysProps = {keyboardType: 'number-pad' as const, maxLength: 4, selectTextOnFocus: true};

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader onBack={() => navigation.goBack()} backIcon="close" eyebrow={t('addZone.eyebrow')} title={t('addZone.title')}/>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.body}>{t('addZone.text')}</Text>

        <Card style={styles.card}>
          <SelectField
            label={t('addZone.country')}
            leading={code ? countryCodeToFlag(code) : undefined}
            value={code ? countryName(code, lang) : null}
            placeholder={t('countryPicker.title')}
            onPress={() => setPicker(true)}
          />
          <View>
            <TextField
              label={t('addZone.name')}
              value={name}
              onChangeText={setName}
              placeholder={code ? countryName(code, lang) : ''}
            />
            <Text style={styles.hint}>{t('addZone.nameHint')}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <View>
            <FieldLabel>{t('addZone.ruleType')}</FieldLabel>
            <SegmentedControl
              options={[
                {value: 'per_visit', label: t('addZone.rulePerVisit')},
                {value: 'rolling_window', label: t('addZone.ruleWindow')},
              ]}
              value={ruleType}
              onChange={setRuleType}
            />
          </View>
          <View>
            <TextField
              label={`${t('addZone.maxStay')}, ${t('addZone.daysUnit')}`}
              value={maxStayText}
              onChangeText={(v) => setMaxStayText(v.replace(/\D/g, ''))}
              {...daysProps}
            />
            <Text style={styles.hint}>{perVisit ? t('addZone.maxStayHintVisit') : t('addZone.maxStayHintWindow')}</Text>
          </View>
          {perVisit ? null : (
            <View>
              <TextField
                label={t('addZone.window')}
                value={windowText}
                onChangeText={(v) => setWindowText(v.replace(/\D/g, ''))}
                {...daysProps}
              />
              <Text style={[styles.hint, windowTooSmall && styles.error]}>
                {windowTooSmall ? t('addZone.windowTooSmall') : t('addZone.windowHint')}
              </Text>
            </View>
          )}
        </Card>

        {maxStay > 0 && (perVisit || (windowDays > 0 && !windowTooSmall)) ? (
          <View style={styles.card}>
            <InfoBanner
              icon="calculator-outline"
              tone="safe"
              title={t('addZone.previewTitle')}
              text={perVisit
                ? t('addZone.previewVisit', {max: maxStay})
                : t('addZone.previewWindow', {max: maxStay, window: windowDays})}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <InfoBanner icon="help-circle-outline" title={t('addZone.helpTitle')} text={t('addZone.helpText')}/>
        </View>

        {existingZone ? (
          <View style={styles.card}>
            <InfoBanner icon="information-circle-outline" tone="warning" text={t('addZone.exists', {zone: zoneLabel.name(existingZone)})}/>
          </View>
        ) : null}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label={t('addZone.save')} icon="add" onPress={save} disabled={!canSave}/>
      </SafeAreaView>
      <CountryPickerSheet visible={picker} onSelect={setCode} onClose={() => setPicker(false)}/>
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: space.xl},
    body: {...typography.bodyMd, color: colors.textBody},
    card: {marginTop: space.md, gap: space.md},
    hint: {...typography.bodySm, color: colors.textMuted, marginTop: space.xs + 2},
    error: {color: colors.danger},
    footer: {paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm},
  });
}
