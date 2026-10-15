import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { radius, space, typography, fonts, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useT, type TranslationKey } from '../../i18n';
import { useRootNavigation, type MainTabsParamList } from '../../navigation/types';
import { Button, type IconName } from '../ui';

const TAB_META: Record<keyof MainTabsParamList, { icon: IconName; activeIcon: IconName; label: TranslationKey }> = {
  Home: {icon: 'home-outline', activeIcon: 'home', label: 'tabs.home'},
  Calendar: {icon: 'calendar-outline', activeIcon: 'calendar', label: 'tabs.calendar'},
  History: {icon: 'time-outline', activeIcon: 'time', label: 'tabs.history'},
  Reports: {icon: 'bar-chart-outline', activeIcon: 'bar-chart', label: 'tabs.reports'},
};

// Height of the floating button above the tab bar — screens add this padding to their content.
export const FLOATING_CTA_SPACE = 88;

export function TabBar({state, navigation}: BottomTabBarProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const {t} = useT();
  const rootNavigation = useRootNavigation();

  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, space.sm)}]}>
      <View style={styles.cta} pointerEvents="box-none">
        <Button
          label={t('tabs.addTrip')}
          icon="add"
          pill
          onPress={() => rootNavigation.navigate('AddTrip')}
          style={styles.ctaButton}
        />
      </View>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name as keyof MainTabsParamList];
        const color = focused ? theme.colors.tabActive : theme.colors.tabInactive;
        const onPress = () => {
          const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={t(meta.label)}
          >
            <Ionicons name={focused ? meta.activeIcon : meta.icon} size={24} color={color}/>
            <Text style={[styles.label, {color}, focused && styles.labelActive]}>{t(meta.label)}</Text>
            {focused ? <View style={[styles.dot, {backgroundColor: color}]}/> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row', paddingTop: space.sm, backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong,
    },
    cta: {position: 'absolute', top: -72, left: 0, right: 0, alignItems: 'center'},
    ctaButton: {minWidth: 240},
    tab: {flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.xs},
    label: {...typography.labelMd, fontSize: 11},
    labelActive: {fontFamily: fonts.bold},
    dot: {width: 4, height: 4, borderRadius: radius.full, marginTop: 1},
  });
}
