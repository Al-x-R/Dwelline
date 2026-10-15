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

const window90of180: StayRules = {kind: 'rolling_window', windowSizeDays: 180, maxStayDays: 90};
const perVisit = (days: number): StayRules => ({kind: 'per_visit', windowSizeDays: days, maxStayDays: days});
// 180 is the display fallback; the real limit is 6 calendar months from entry.
const sixMonths: StayRules = {kind: 'per_visit', windowSizeDays: 180, maxStayDays: 180, maxStayMonths: 6};

// Not yet checked against official sources — see verifiedAt.
const rule = (mode: PassportRule['mode'], constraints: StayRules[], requires?: Requirement[]): PassportRule =>
  ({mode, constraints, requires, source: null, verifiedAt: null});

const FREE = rule('free', []);
const SCHENGEN_VISA_FREE = rule('visa_free', [window90of180]);
const GEORGIA = rule('visa_free', [perVisit(365)], ['insurance']);
const EGYPT_ON_ARRIVAL = rule('visa_on_arrival', [perVisit(30)]);
const UK_WITH_ETA = rule('visa_free', [sixMonths], ['eta']);
const UK_VISA = rule('visa_required', [sixMonths]);

// Only cells we're confident about; a missing cell resolves to 'unknown'.
// TODO before release: verify every cell against the official source and fill source/verifiedAt.
export const PASSPORT_RULES: Record<PassportGroup, Partial<Record<string, PassportRule>>> = {
  EU: {
    schengen: FREE,
    cyprus: FREE,
    moldova: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uk: UK_WITH_ETA,
  },
  GB: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    moldova: SCHENGEN_VISA_FREE,
    turkey: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
  },
  US: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    moldova: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uk: UK_WITH_ETA,
  },
  CA: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    moldova: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uk: UK_WITH_ETA,
  },
  AU: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    moldova: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uk: UK_WITH_ETA,
  },
  IL: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    uk: UK_WITH_ETA,
  },
  UA: {
    schengen: SCHENGEN_VISA_FREE,
    cyprus: SCHENGEN_VISA_FREE,
    moldova: SCHENGEN_VISA_FREE,
    turkey: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    uae: rule('visa_free', [perVisit(30)]),
    uk: UK_VISA,
  },
  RU: {
    schengen: rule('visa_required', [window90of180]),
    moldova: SCHENGEN_VISA_FREE,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uk: UK_VISA,
  },
};
