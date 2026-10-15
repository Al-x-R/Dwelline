import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { space, typography, type AppTheme } from '../constants/theme';
import { countryCodeToFlag, countryName } from '../constants/countries';
import { NO_ZONE } from '../constants/zones';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useZoneLabel, useZones, zoneIdForCountry } from '../hooks/useZones';
import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { useZonesStore } from '../store/zonesStore';
import { Button, Card, InfoBanner, ListRow, Screen, ScreenHeader, SelectField, Stepper, TextField } from '../components/ui';
import { CountryPickerSheet } from '../components/app/CountryPickerSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'AddZone'>;

const STAY_STEP = 5;
const WINDOW_STEP = 30;

export default function AddZoneScreen({navigation}: Props) {
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const {allZones} = useZones();
  const zoneLabel = useZoneLabel();
  const addCustomZone = useZonesStore((s) => s.addCustomZone);
  const setSelectedZoneId = useSettingsStore((s) => s.setSelectedZoneId);

  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [maxStay, setMaxStay] = useState(90);
  const [windowDays, setWindowDays] = useState(180);
  const [picker, setPicker] = useState(false);

  const existingZone = code ? allZones.find((z) => z.id === zoneIdForCountry(code, allZones) && z.id !== NO_ZONE) : undefined;
  const canSave = !!code && maxStay > 0 && windowDays >= maxStay;

  const save = async () => {
    if (!code) return;
    const id = `custom_${code.toLowerCase()}_${Date.now().toString(36)}`;
    await addCustomZone({
      id,
      name: name.trim() || countryName(code, lang),
      flag: countryCodeToFlag(code),
      ruleType: 'rolling_window',
      windowSizeDays: windowDays,
      maxStayDays: maxStay,
      isMultiCountry: false,
      countryCodes: [code],
    });
    setSelectedZoneId(id);
    navigation.goBack();
  };

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
          <TextField
            label={t('addZone.name')}
            value={name}
            onChangeText={setName}
            placeholder={code ? countryName(code, lang) : ''}
          />
        </Card>
        <Card padded={false} style={[styles.card, styles.group]}>
          <ListRow
            icon="hourglass-outline"
            iconTone="safe"
            title={t('addZone.maxStay')}
            trailing={
              <Stepper value={maxStay} label={String(maxStay)} onChange={setMaxStay} min={STAY_STEP} max={windowDays} step={STAY_STEP} accessibilityLabel={t('addZone.maxStay')}/>
            }
          />
          <ListRow
            icon="calendar-outline"
            iconTone="primary"
            title={t('addZone.window')}
            trailing={
              <Stepper value={windowDays} label={String(windowDays)} onChange={setWindowDays} min={WINDOW_STEP} max={720} step={WINDOW_STEP} accessibilityLabel={t('addZone.window')}/>
            }
            last
          />
        </Card>
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
    group: {paddingHorizontal: space.md, gap: 0},
    footer: {paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm},
  });
}
