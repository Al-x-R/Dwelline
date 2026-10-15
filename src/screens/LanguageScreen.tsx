import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { radius, space, typography, fonts, type AppTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { translate, useT } from '../i18n';
import { LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_NATIVE_NAMES, type Language } from '../i18n/types';
import type { RootStackParamList } from '../navigation/types';
import {
  deviceDateFormat, deviceWeekStart, useSettingsStore, type DateFormat, type WeekStart,
} from '../store/settingsStore';
import { displayDateFormat } from '../utils/format';
import { Button, Card, InfoBanner, ListRow, OptionSheet, Pill, Screen, ScreenHeader, SectionHeader, Toggle } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

const DATE_FORMATS: DateFormat[] = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export default function LanguageScreen({navigation}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const settings = useSettingsStore();

  // Changes apply only when "Save" is pressed.
  const [language, setLanguage] = useState<Language>(settings.language);
  const [auto, setAuto] = useState(settings.autoRegional);
  const [dateFormat, setDateFormat] = useState<DateFormat>(settings.dateFormat);
  const [weekStart, setWeekStart] = useState<WeekStart>(settings.weekStart);
  const [formatSheet, setFormatSheet] = useState(false);
  const [weekSheet, setWeekSheet] = useState(false);

  const effectiveFormat = auto ? deviceDateFormat() : dateFormat;
  const effectiveWeek = auto ? deviceWeekStart() : weekStart;
  const decimal = language === 'en' ? t('language.decimalDot') : t('language.decimalComma');

  const save = () => {
    settings.setLanguage(language);
    settings.setRegional({autoRegional: auto, dateFormat, weekStart});
    navigation.goBack();
  };

  return (
    <Screen glow="primary">
      <ScreenHeader onBack={() => navigation.goBack()} title={t('language.title')}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="globe-outline" size={24} color={theme.colors.accentText}/>
          </View>
          <View>
            <Text style={styles.eyebrow}>{t('language.eyebrow')}</Text>
            <Text style={styles.introTitle}>Dwelline</Text>
          </View>
        </View>
        <Text style={styles.body}>{t('language.intro')}</Text>

        <View style={styles.list} accessibilityRole="radiogroup">
          {LANGUAGES.map((code) => {
            const active = code === language;
            return (
              <Pressable
                key={code}
                style={({pressed}) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
                onPress={() => setLanguage(code)}
                accessibilityRole="radio"
                accessibilityState={{selected: active}}
                accessibilityLabel={LANGUAGE_NATIVE_NAMES[code]}
              >
                {active ? <View style={styles.activeBar}/> : null}
                <View style={styles.flagBox}>
                  <Text style={styles.flag}>{LANGUAGE_FLAGS[code]}</Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{LANGUAGE_NATIVE_NAMES[code]}</Text>
                    <Text style={styles.localName}>{t(`language.name.${code}`)}</Text>
                    {code === lang ? <Pill label={t('language.current')} tone="primary" caps/> : null}
                  </View>
                  <Text style={styles.sample} numberOfLines={1}>{translate(code, 'language.sample')}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary}/> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title={t('language.regional')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="options-outline"
            title={t('language.auto')}
            subtitle={t('language.autoHint')}
            trailing={<Toggle value={auto} onValueChange={setAuto} accessibilityLabel={t('language.auto')}/>}
          />
          <ListRow
            icon="calendar-outline"
            title={t('language.dateFormat')}
            value={displayDateFormat(effectiveFormat, language)}
            onPress={auto ? undefined : () => setFormatSheet(true)}
            chevron={!auto}
          />
          <ListRow
            icon="grid-outline"
            title={t('language.weekStart')}
            value={effectiveWeek === 1 ? t('language.monday') : t('language.sunday')}
            onPress={auto ? undefined : () => setWeekSheet(true)}
            chevron={!auto}
          />
          <ListRow icon="calculator-outline" title={t('language.decimal')} value={decimal} last/>
        </Card>

        <View style={styles.block}>
          <InfoBanner icon="shield-checkmark-outline" tone="warning" title={t('language.legalTitle')} text={t('language.legalText')}/>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label={t('language.save')} icon="checkmark-circle-outline" onPress={save}/>
        <View style={styles.instant}>
          <Ionicons name="flash-outline" size={14} color={theme.colors.textMuted}/>
          <Text style={styles.instantText}>{t('language.instant')}</Text>
        </View>
      </SafeAreaView>

      <OptionSheet
        visible={formatSheet}
        title={t('language.dateFormat')}
        options={DATE_FORMATS.map((f) => ({value: f, label: displayDateFormat(f, language)}))}
        value={dateFormat}
        onSelect={setDateFormat}
        onClose={() => setFormatSheet(false)}
      />
      <OptionSheet<WeekStart>
        visible={weekSheet}
        title={t('language.weekStart')}
        options={[{value: 1, label: t('language.monday')}, {value: 0, label: t('language.sunday')}]}
        value={weekStart}
        onSelect={setWeekStart}
        onClose={() => setWeekSheet(false)}
      />
    </Screen>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: space.xl},
    flex: {flex: 1},
    pressed: {opacity: 0.85},
    intro: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, marginBottom: space.gutterSm},
    introIcon: {
      width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    eyebrow: {...typography.labelCaps, color: colors.accentText},
    introTitle: {...typography.headlineSm, color: colors.textPrimary},
    body: {...typography.bodyMd, color: colors.textBody},
    list: {gap: space.gutterSm, marginTop: space.lg},
    option: {
      flexDirection: 'row', alignItems: 'center', gap: space.gutterSm, padding: space.md, borderRadius: radius.lg,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...elevation.card,
    },
    optionActive: {backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong},
    activeBar: {position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.accentText},
    flagBox: {
      width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.canvas,
    },
    flag: {fontSize: 26},
    nameRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm},
    name: {...typography.headlineSm, color: colors.textPrimary},
    localName: {...typography.bodySm, color: colors.textMuted},
    sample: {...typography.bodySm, color: colors.textBody, marginTop: space.xs},
    radio: {
      width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceHighest,
    },
    radioActive: {backgroundColor: colors.primary, ...elevation.interactive},
    group: {paddingHorizontal: space.md},
    block: {marginTop: space.lg},
    footer: {paddingHorizontal: space.md, paddingTop: space.gutterSm, paddingBottom: space.sm, backgroundColor: colors.canvas},
    instant: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs + 2, marginTop: space.sm},
    instantText: {...typography.labelCaps, fontFamily: fonts.bold, color: colors.textMuted},
  });
}
