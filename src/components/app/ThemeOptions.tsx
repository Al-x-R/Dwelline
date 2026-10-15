import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../hooks/useAppTheme';
import { useT } from '../../i18n';
import { useSettingsStore, type ThemeMode } from '../../store/settingsStore';
import { ListRow, type IconName } from '../ui';

const OPTIONS: { mode: ThemeMode; icon: IconName }[] = [
  {mode: 'system', icon: 'phone-portrait-outline'},
  {mode: 'light', icon: 'sunny-outline'},
  {mode: 'dark', icon: 'moon-outline'},
];

export function ThemeOptions({onSelected}: { onSelected?: () => void }) {
  const theme = useAppTheme();
  const {t} = useT();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  return (
    <View accessibilityRole="radiogroup">
      {OPTIONS.map((opt, i) => {
        const active = opt.mode === themeMode;
        return (
          <ListRow
            key={opt.mode}
            icon={opt.icon}
            iconTone={active ? 'primary' : 'neutral'}
            title={t(`settings.theme.${opt.mode}`)}
            onPress={() => {
              setThemeMode(opt.mode);
              onSelected?.();
            }}
            trailing={
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? theme.colors.safe : theme.colors.textMuted}
              />
            }
            last={i === OPTIONS.length - 1}
          />
        );
      })}
    </View>
  );
}
