import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { countryName } from '../../constants/countries';
import { space } from '../../constants/theme';
import type { ZoneConfig } from '../../constants/zones';
import type { Exemption, ZoneAccess } from '../../core/zoneAccess';
import { useFormatters } from '../../hooks/useFormatters';
import { useTravelDocuments } from '../../hooks/useZoneContext';
import { useZoneLabel } from '../../hooks/useZones';
import { useT } from '../../i18n';
import { useRootNavigation } from '../../navigation/types';
import { InfoBanner } from '../../components/ui';

interface Props {
  zone: ZoneConfig;
  access: ZoneAccess;
}

// What the user's documents mean for this zone: no limit, visa needed, unverified, exempt days, requirements.
export function ZoneAccessBanner({zone, access}: Props) {
  const {t, lang} = useT();
  const fmt = useFormatters();
  const zoneLabel = useZoneLabel();
  const navigation = useRootNavigation();
  const {passports} = useTravelDocuments();
  const rule = zoneLabel.rule(zone);

  const until = (e: Exemption) => (e.until ? t('access.untilSuffix', {date: fmt.full(e.until)}) : '');
  const status = (e: Exemption) => t(`docs.kind.${e.kind}`);

  const banners: React.ReactNode[] = [];

  if (passports.length === 0) {
    banners.push(
      <Pressable key="passport" onPress={() => navigation.navigate('Settings')} accessibilityRole="button">
        <InfoBanner
          icon="id-card-outline"
          tone="primary"
          title={t('access.addPassportTitle')}
          text={t('access.addPassportText', {rule})}
        />
      </Pressable>
    );
  } else if (access.mode === 'free') {
    const e = access.exemptions[0];
    banners.push(
      <InfoBanner
        key="free"
        icon="checkmark-circle-outline"
        tone="safe"
        title={t('access.freeTitle')}
        text={access.basis === 'residence' && e
          ? t('access.freeResidence', {status: status(e), country: countryName(e.countryCode, lang), until: until(e)})
          : t('access.freeCitizen')}
      />
    );
  } else if (access.mode === 'visa_required') {
    banners.push(
      <InfoBanner key="visa" icon="document-text-outline" tone="warning" title={t('access.visaTitle')} text={t('access.visaText', {rule})}/>
    );
  } else if (access.mode === 'unknown') {
    banners.push(
      <InfoBanner key="unknown" icon="help-circle-outline" title={t('access.unknownTitle')} text={t('access.unknownText', {rule})}/>
    );
  }

  if (access.mode !== 'free') {
    for (const e of access.exemptions) {
      banners.push(
        <InfoBanner
          key={`exempt-${e.countryCode}`}
          icon="home-outline"
          tone="safe"
          compact
          title={t('access.exemptTitle', {country: countryName(e.countryCode, lang)})}
          text={t('access.exemptText', {status: status(e), until: until(e)})}
        />
      );
    }
  }

  if (access.mode !== 'free' && access.requires.length > 0) {
    banners.push(
      <InfoBanner
        key="requires"
        icon="clipboard-outline"
        compact
        title={t('access.requiresTitle')}
        text={access.requires.map((r) => t(`access.requires.${r}`)).join('\n')}
      />
    );
  }

  if (banners.length === 0) return null;
  return <View style={styles.list}>{banners}</View>;
}

const styles = StyleSheet.create({
  list: {gap: space.sm},
});
