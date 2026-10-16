import type { StayRules } from '../core/schengenCalculator';
import type { PassportRule, Requirement } from '../types/documents';

// EU member states plus EEA and Switzerland: free movement inside the EU/Schengen.
export const EU_EEA_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH',
];

// Temporary protection can only be granted by EU member states.
export const TEMPORARY_PROTECTION_CODES = EU_EEA_CODES.filter((c) => !['IS', 'LI', 'NO', 'CH'].includes(c));

// Protection for people displaced from Ukraine, as extended by the EU Council in July 2025.
export const TEMPORARY_PROTECTION_UNTIL = '2027-03-04';

export type PassportGroup = 'EU' | 'GB' | 'US' | 'CA' | 'AU' | 'IL' | 'UA' | 'RU';

export function passportGroup(code: string): PassportGroup | null {
  if (EU_EEA_CODES.includes(code)) return 'EU';
  return (['GB', 'US', 'CA', 'AU', 'IL', 'UA', 'RU'] as const).find((g) => g === code) ?? null;
}

const VERIFIED_AT = '2026-10-15';

const SRC = {
  // EU visa list (Annex I — visa required, Annex II — 90/180). Binds every EU state except Ireland, so Cyprus too.
  euVisaList: 'https://eur-lex.europa.eu/eli/reg/2018/1806/oj',
  euFreeMovement: 'https://eur-lex.europa.eu/eli/dir/2004/38/oj',
  ukEta: 'https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta',
  ukVisaNationals: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-visitor-visa-national-list',
  ukPolicy: 'https://en.wikipedia.org/wiki/Visa_policy_of_the_United_Kingdom',
  moldova: 'https://austria.mfa.gov.md/en/content/visas-0',
  turkey: 'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa',
  // Cites Ordinance 255 (2015) for the 1-year stay and Decree 602 (2025) for mandatory insurance.
  georgia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Georgia',
  egypt: 'https://en.wikipedia.org/wiki/Visa_policy_of_Egypt',
  // Official u.ae / ICP pages were unreachable; cross-checked with an October 2024 Vialto Partners alert.
  uae: 'https://www.khaleejtimes.com/life-and-living/uae-full-list-countries-visa-free-entry-visa-on-arrival',
} as const;

const window90of180: StayRules = {kind: 'rolling_window', windowSizeDays: 180, maxStayDays: 90};
const perVisit = (days: number): StayRules => ({kind: 'per_visit', windowSizeDays: days, maxStayDays: days});
// 180 is the display fallback; the real limit is 6 calendar months from entry.
const sixMonths: StayRules = {kind: 'per_visit', windowSizeDays: 180, maxStayDays: 180, maxStayMonths: 6};

const rule = (
  mode: PassportRule['mode'],
  constraints: StayRules[],
  source: string,
  sourceKind: PassportRule['sourceKind'],
  requires?: Requirement[]
): PassportRule => ({mode, constraints, requires, source, sourceKind, verifiedAt: VERIFIED_AT});

// Where an official page says only "up to 90 days" without a window, the stricter 90/180 is applied.
const EU_FREE = rule('free', [], SRC.euFreeMovement, 'official');
const EU_VISA_FREE = rule('visa_free', [window90of180], SRC.euVisaList, 'official');
const EU_VISA_REQUIRED = rule('visa_required', [window90of180], SRC.euVisaList, 'official');
const MOLDOVA = rule('visa_free', [window90of180], SRC.moldova, 'official');
const TURKEY = rule('visa_free', [window90of180], SRC.turkey, 'official');
const GEORGIA = rule('visa_free', [perVisit(365)], SRC.georgia, 'secondary', ['insurance']);
const EGYPT_ON_ARRIVAL = rule('visa_on_arrival', [perVisit(30)], SRC.egypt, 'secondary');
const UAE_90 = rule('visa_free', [window90of180], SRC.uae, 'secondary');
const UAE_30 = rule('visa_free', [perVisit(30)], SRC.uae, 'secondary');
const UK_ETA = rule('visa_free', [sixMonths], SRC.ukEta, 'official', ['eta']);
const UK_VISA = rule('visa_required', [sixMonths], SRC.ukVisaNationals, 'official');

// A missing cell resolves to 'unknown' and falls back to the zone's default rule.
export const PASSPORT_RULES: Record<PassportGroup, Partial<Record<string, PassportRule>>> = {
  EU: {
    schengen: EU_FREE,
    cyprus: EU_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    uk: UK_ETA,
  },
  GB: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
  },
  US: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    uk: UK_ETA,
  },
  CA: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    uk: UK_ETA,
  },
  // Not on Moldova's official visa-free list, so that cell stays unknown.
  AU: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    uk: UK_ETA,
  },
  IL: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    // No visa on arrival; a pre-approved visa is needed.
    egypt: rule('visa_required', [perVisit(30)], SRC.egypt, 'secondary'),
    uae: UAE_90,
    uk: rule('visa_free', [sixMonths], SRC.ukPolicy, 'secondary', ['eta']),
  },
  UA: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_30,
    uk: UK_VISA,
  },
  RU: {
    schengen: EU_VISA_REQUIRED,
    cyprus: EU_VISA_REQUIRED,
    moldova: MOLDOVA,
    // Official page states 60 days per travel only; a 90/180 cap from the bilateral agreement isn't confirmed there.
    turkey: rule('visa_free', [perVisit(60)], SRC.turkey, 'official'),
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    uk: UK_VISA,
  },
};

// Single countries whose rule differs from their group; checked before PASSPORT_RULES.
export const PASSPORT_OVERRIDES: Partial<Record<string, Partial<Record<string, PassportRule>>>> = {
  // Common Travel Area: Irish citizens need no ETA or visa for the UK.
  IE: {
    uk: rule('free', [], SRC.ukPolicy, 'secondary'),
    uae: UAE_30,
  },
  CY: {
    turkey: rule('visa_required', [window90of180], SRC.turkey, 'official'),
  },
};
