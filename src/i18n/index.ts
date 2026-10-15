import { useMemo } from 'react';
import { getLocales } from 'expo-localization';

import { useSettingsStore } from '../store/settingsStore';
import { LANGUAGES, type Language, type PluralForms, type TranslationParams, type TranslationValue } from './types';
import ru, { type TranslationKey } from './locales/ru';
import en from './locales/en';
import uk from './locales/uk';

export type { TranslationKey };
export type { Language };

const DICTIONARIES: Record<Language, Record<TranslationKey, TranslationValue>> = {ru, en, uk};

function pluralForm(lang: Language, count: number, forms: PluralForms): string {
  const n = Math.abs(Math.trunc(count));
  if (lang === 'en') return n === 1 ? forms.one : forms.many;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few ?? forms.many;
  return forms.many;
}

export function translate(lang: Language, key: TranslationKey, params?: TranslationParams): string {
  const value = DICTIONARIES[lang][key] ?? DICTIONARIES.ru[key] ?? key;
  const template = typeof value === 'string' ? value : pluralForm(lang, Number(params?.count ?? 0), value);
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

export type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

export function useT(): { t: TFunction; lang: Language } {
  const lang = useSettingsStore((s) => s.language);
  return useMemo(() => ({lang, t: (key, params) => translate(lang, key, params)}), [lang]);
}

export function detectDeviceLanguage(): Language {
  for (const locale of getLocales()) {
    const code = locale.languageCode as Language | null;
    if (code && LANGUAGES.includes(code)) return code;
  }
  return 'en';
}
