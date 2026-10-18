import React from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '../../constants/theme';
import { useT } from '../../i18n';
import { useProGate } from '../../hooks/useProGate';
import { useRootNavigation } from '../../navigation/types';
import { BottomSheet, ListRow, type IconName, type Tone } from '../ui';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type MenuTarget = 'Simulator' | 'AddTrip' | 'Settings' | 'Language' | 'Plans' | 'AddZone' | 'Onboarding';

export function MenuSheet({visible, onClose}: Props) {
  const {t} = useT();
  const navigation = useRootNavigation();
  const {isPro, requirePro} = useProGate();

  const items: { icon: IconName; tone: Tone; title: string; subtitle?: string; target: MenuTarget; pro?: boolean }[] = [
    {icon: 'analytics-outline', tone: 'safe', title: t('menu.simulator'), subtitle: t('menu.simulatorHint'), target: 'Simulator', pro: true},
    {icon: 'add-circle-outline', tone: 'primary', title: t('menu.addTrip'), subtitle: t('menu.addTripHint'), target: 'AddTrip'},
    {icon: 'earth-outline', tone: 'primary', title: t('menu.addZone'), subtitle: t('menu.addZoneHint'), target: 'AddZone', pro: true},
    {icon: 'diamond-outline', tone: 'warning', title: t('menu.pro'), subtitle: t('menu.proHint'), target: 'Plans'},
    {icon: 'settings-outline', tone: 'neutral', title: t('menu.settings'), subtitle: t('menu.settingsHint'), target: 'Settings'},
    {icon: 'language-outline', tone: 'neutral', title: t('menu.language'), target: 'Language'},
    {icon: 'information-circle-outline', tone: 'neutral', title: t('menu.intro'), target: 'Onboarding'},
  ];

  const go = (target: MenuTarget, pro?: boolean) => {
    onClose();
    if (pro) requirePro(() => navigation.navigate(target));
    else navigation.navigate(target);
  };

  return (
    <BottomSheet visible={visible} title={t('menu.title')} onClose={onClose}>
      <View style={styles.list}>
        {items.map((item, i) => (
          <ListRow
            key={item.target}
            icon={item.icon}
            iconTone={item.tone}
            title={item.title}
            subtitle={item.subtitle}
            value={item.pro && !isPro ? t('pro.badge') : undefined}
            onPress={() => go(item.target, item.pro)}
            last={i === items.length - 1}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {paddingBottom: space.sm},
});
