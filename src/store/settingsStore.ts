import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { getCalendars, getLocales } from 'expo-localization';

import type { Language } from '../i18n/types';

export type ThemeMode = 'system' | 'light' | 'dark';
export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type WeekStart = 0 | 1; // 0 — Sunday, 1 — Monday

interface SettingsState {
  hydrated: boolean;
  onboardingDone: boolean;

  language: Language;
  autoRegional: boolean;
  dateFormat: DateFormat;
  weekStart: WeekStart;
  themeMode: ThemeMode;

  selectedZoneId: string;
  safetyBufferDays: number;

  overstayAlerts: boolean;
  rollOffAlerts: boolean;

  setOnboardingDone: (done: boolean) => void;
  setLanguage: (language: Language) => void;
  setRegional: (patch: { autoRegional?: boolean; dateFormat?: DateFormat; weekStart?: WeekStart }) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSelectedZoneId: (zoneId: string) => void;
  setSafetyBufferDays: (days: number) => void;
  setAlerts: (patch: { overstayAlerts?: boolean; rollOffAlerts?: boolean }) => void;
}

export const MIN_BUFFER_DAYS = 0;
export const MAX_BUFFER_DAYS = 30;

export function applyThemeMode(mode: ThemeMode) {
  // Native components (Alert, DateTimePicker, keyboard) follow the selected theme too.
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

export function deviceWeekStart(): WeekStart {
  // expo-localization: firstWeekday 1 = Sunday, 2 = Monday.
  return getCalendars()[0]?.firstWeekday === 1 ? 0 : 1;
}

export function deviceDateFormat(): DateFormat {
  return getLocales()[0]?.regionCode === 'US' ? 'MM/DD/YYYY' : 'DD.MM.YYYY';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingDone: false,

      language: 'ru',
      autoRegional: true,
      dateFormat: 'DD.MM.YYYY',
      weekStart: 1,
      themeMode: 'system',

      selectedZoneId: 'schengen',
      safetyBufferDays: 14,

      overstayAlerts: true,
      rollOffAlerts: true,

      setOnboardingDone: (onboardingDone) => set({onboardingDone}),
      setLanguage: (language) => set({language}),
      setRegional: (patch) =>
        set((s) => {
          const autoRegional = patch.autoRegional ?? s.autoRegional;
          return {
            autoRegional,
            dateFormat: autoRegional ? deviceDateFormat() : patch.dateFormat ?? s.dateFormat,
            weekStart: autoRegional ? deviceWeekStart() : patch.weekStart ?? s.weekStart,
          };
        }),
      setThemeMode: (themeMode) => {
        applyThemeMode(themeMode);
        set({themeMode});
      },
      setSelectedZoneId: (selectedZoneId) => set({selectedZoneId}),
      setSafetyBufferDays: (days) =>
        set({safetyBufferDays: Math.min(MAX_BUFFER_DAYS, Math.max(MIN_BUFFER_DAYS, days))}),
      setAlerts: (patch) => set((s) => ({...s, ...patch})),
    }),
    {
      name: '@dwelline/settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({hydrated: _hydrated, ...rest}) => rest,
      version: 1,
      // v1: dropped citizenshipCode / residenceCode.
      migrate: (persisted) => {
        const {citizenshipCode: _c, residenceCode: _r, ...rest} = persisted as Record<string, unknown>;
        return rest as Partial<SettingsState>;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeMode(state.themeMode);
          if (state.autoRegional) state.setRegional({});
        }
        useSettingsStore.setState({hydrated: true});
      },
    }
  )
);
