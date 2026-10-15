import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import appConfig from '../../app.json';
import { radius, space, typography, fonts, type AppTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useZoneLabel, useZones } from '../hooks/useZones';
import { useT } from '../i18n';
import { LANGUAGE_NATIVE_NAMES } from '../i18n/types';
import type { RootStackParamList } from '../navigation/types';
import { MAX_BUFFER_DAYS, MIN_BUFFER_DAYS, useSettingsStore } from '../store/settingsStore';
import { resetAllData } from '../store/actions';
import { shareTripsCsv } from '../services/exportService';
import { displayDateFormat } from '../utils/format';
import { BottomSheet, Card, ConfirmDialog, ListRow, Screen, ScreenHeader, SectionHeader, Stepper, Toggle } from '../components/ui';
import { ThemeOptions } from '../components/app/ThemeOptions';
import { ZoneToggleList } from '../components/app/ZoneToggleList';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const REGULATION_URL = 'https://eur-lex.europa.eu/eli/reg/2016/399/oj';

export default function SettingsScreen({navigation}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {t, lang} = useT();
  const {selectedZone, activeZones} = useZones();
  const zoneLabel = useZoneLabel();
  const s = useSettingsStore();

  const [themeSheet, setThemeSheet] = useState(false);
  const [zonesSheet, setZonesSheet] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen glow="primary">
      <ScreenHeader onBack={() => navigation.goBack()} eyebrow={t('settings.eyebrow')} title={t('settings.title')}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>

        <Pressable onPress={() => navigation.navigate('Plans')} accessibilityRole="button" style={({pressed}) => pressed && styles.pressed}>
          <LinearGradient
            colors={theme.dark ? ['rgba(99,102,241,0.28)', 'rgba(16,185,129,0.14)'] : ['#EEF0FF', '#ECFDF5']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.pro}
          >
            <View style={styles.proTop}>
              <View style={styles.proIcon}>
                <Ionicons name="star" size={18} color={theme.colors.warning}/>
              </View>
              <View style={styles.flex}>
                <Text style={styles.proTitle}>{t('settings.proTitle')}</Text>
                <Text style={styles.proText}>{t('settings.proText')}</Text>
              </View>
              <Text style={styles.proAction}>{t('settings.proAction')}</Text>
            </View>
            <View style={styles.proBottom}>
              <Ionicons name="lock-closed-outline" size={14} color={theme.colors.safe}/>
              <Text style={styles.proMeta}>{t('settings.storage')}</Text>
              <Text style={[styles.proMeta, styles.proMetaRight]}>{t('settings.zonesTracked', {count: activeZones.length})}</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <SectionHeader title={t('settings.localization')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="language-outline"
            iconTone="primary"
            title={t('settings.language')}
            subtitle={t('settings.languageHint', {format: displayDateFormat(s.dateFormat, lang)})}
            value={LANGUAGE_NATIVE_NAMES[lang]}
            onPress={() => navigation.navigate('Language')}
          />
          <ListRow
            icon={theme.dark ? 'moon-outline' : 'sunny-outline'}
            iconTone="primary"
            title={t('settings.theme')}
            subtitle={t('settings.themeHint')}
            value={t(`settings.theme.${s.themeMode}`)}
            onPress={() => setThemeSheet(true)}
            last
          />
        </Card>

        <SectionHeader title={t('settings.engine')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="calculator-outline"
            iconTone="safe"
            title={t('settings.window', {rule: zoneLabel.rule(selectedZone)})}
            subtitle={t('settings.windowHint', {window: selectedZone.windowSizeDays ?? 180})}
          />
          <ListRow
            icon="time-outline"
            title={t('settings.entryExit')}
            subtitle={t('settings.entryExitHint')}
            value={t('settings.entryExitValue')}
          />
          <ListRow
            icon="shield-outline"
            iconTone="warning"
            title={t('settings.buffer')}
            subtitle={t('settings.bufferHint')}
            trailing={
              <Stepper
                value={s.safetyBufferDays}
                label={t('settings.bufferValue', {count: s.safetyBufferDays})}
                onChange={s.setSafetyBufferDays}
                min={MIN_BUFFER_DAYS}
                max={MAX_BUFFER_DAYS}
                accessibilityLabel={t('settings.buffer')}
              />
            }
          />
          <ListRow
            icon="flag-outline"
            title={t('settings.national')}
            subtitle={t('settings.nationalHint')}
            value={t('settings.nationalValue')}
          />
          <ListRow
            icon="earth-outline"
            iconTone="primary"
            title={t('settings.zones')}
            value={t('settings.zonesTracked', {count: activeZones.length})}
            onPress={() => setZonesSheet(true)}
            last
          />
        </Card>

        <SectionHeader title={t('settings.alerts')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="warning-outline"
            iconTone="danger"
            title={t('settings.overstay')}
            subtitle={t('settings.overstayHint')}
            trailing={<Toggle value={s.overstayAlerts} onValueChange={(v) => s.setAlerts({overstayAlerts: v})} accessibilityLabel={t('settings.overstay')}/>}
          />
          <ListRow
            icon="refresh-outline"
            iconTone="safe"
            title={t('settings.rollOff')}
            subtitle={t('settings.rollOffHint')}
            trailing={<Toggle value={s.rollOffAlerts} onValueChange={(v) => s.setAlerts({rollOffAlerts: v})} accessibilityLabel={t('settings.rollOff')}/>}
            last
          />
        </Card>

        <SectionHeader title={t('settings.data')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="download-outline"
            iconTone="primary"
            title={t('settings.export')}
            subtitle={t('settings.exportHint')}
            value="CSV"
            onPress={() => shareTripsCsv(lang, t('settings.export'))}
          />
          <ListRow
            icon="trash-outline"
            title={t('settings.reset')}
            subtitle={t('settings.resetHint')}
            onPress={() => setConfirmReset(true)}
            destructive
            last
          />
        </Card>

        <SectionHeader title={t('settings.legal')}/>
        <Card padded={false} style={styles.group}>
          <ListRow
            icon="document-text-outline"
            title={t('settings.regulation')}
            subtitle={t('settings.regulationHint')}
            onPress={() => Linking.openURL(REGULATION_URL)}
            external
          />
          <ListRow
            icon="lock-closed-outline"
            title={t('settings.privacy')}
            subtitle={t('settings.privacyHint')}
            onPress={() => Alert.alert(t('settings.privacyTitle'), t('settings.privacyText'))}
          />
          <ListRow
            icon="code-slash-outline"
            title={t('settings.version')}
            subtitle={t('settings.versionHint', {version: appConfig.expo.version})}
            last
          />
        </Card>

        <Text style={styles.footer}>{t('settings.footer')}</Text>
      </ScrollView>

      <BottomSheet visible={themeSheet} title={t('settings.theme')} onClose={() => setThemeSheet(false)}>
        <ThemeOptions onSelected={() => setThemeSheet(false)}/>
      </BottomSheet>

      <BottomSheet visible={zonesSheet} title={t('settings.zones')} onClose={() => setZonesSheet(false)}>
        <ScrollView>
          <ZoneToggleList/>
        </ScrollView>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmReset}
        icon="trash-outline"
        title={t('settings.resetTitle')}
        message={t('settings.resetText')}
        confirmLabel={t('settings.resetConfirm')}
        confirmIcon="trash-outline"
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          await resetAllData();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: space.md, paddingBottom: space.xxl},
    flex: {flex: 1},
    pressed: {opacity: 0.85},
    subtitle: {...typography.bodyMd, color: colors.textMuted, marginBottom: space.md},
    pro: {borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: colors.borderStrong},
    proTop: {flexDirection: 'row', alignItems: 'center', gap: space.gutterSm},
    proIcon: {
      width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.warningSoft,
    },
    proTitle: {...typography.titleMd, color: colors.textPrimary},
    proText: {...typography.bodySm, color: colors.textBody},
    proAction: {...typography.labelMd, fontFamily: fonts.bold, color: colors.accentText},
    proBottom: {
      flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginTop: space.md, paddingTop: space.gutterSm,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    proMeta: {...typography.labelMd, color: colors.textBody},
    proMetaRight: {marginLeft: 'auto'},
    group: {paddingHorizontal: space.md},
    footer: {...typography.labelCaps, color: colors.textMuted, textAlign: 'center', marginTop: space.xl},
  });
}
