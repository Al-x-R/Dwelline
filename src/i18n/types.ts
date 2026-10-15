export type Language = 'ru' | 'en' | 'uk';

export const LANGUAGES: Language[] = ['ru', 'en', 'uk'];

export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {ru: 'Русский', en: 'English', uk: 'Українська'};

export const LANGUAGE_FLAGS: Record<Language, string> = {ru: '🇷🇺', en: '🇬🇧', uk: '🇺🇦'};

// one — 1, 21; few — 2–4, 22–24; many — 0, 5–20. English doesn't need few.
export interface PluralForms {
  one: string;
  few?: string;
  many: string;
}

export type TranslationValue = string | PluralForms;

export type TranslationParams = Record<string, string | number>;
