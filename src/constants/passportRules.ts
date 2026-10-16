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
  // Zones added 2026-10-16, checked against the Wikipedia visa policy pages (which cite each country's MFA).
  montenegro: 'https://en.wikipedia.org/wiki/Visa_policy_of_Montenegro',
  serbia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Serbia',
  albania: 'https://en.wikipedia.org/wiki/Visa_policy_of_Albania',
  northMacedonia: 'https://en.wikipedia.org/wiki/Visa_policy_of_North_Macedonia',
  bosnia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Bosnia_and_Herzegovina',
  kosovo: 'https://en.wikipedia.org/wiki/Visa_policy_of_Kosovo',
  ireland: 'https://en.wikipedia.org/wiki/Visa_policy_of_the_Republic_of_Ireland',
  armenia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Armenia',
  azerbaijan: 'https://en.wikipedia.org/wiki/Visa_policy_of_Azerbaijan',
  kazakhstan: 'https://en.wikipedia.org/wiki/Visa_policy_of_Kazakhstan',
  kyrgyzstan: 'https://en.wikipedia.org/wiki/Visa_policy_of_Kyrgyzstan',
  uzbekistan: 'https://en.wikipedia.org/wiki/Visa_policy_of_Uzbekistan',
  thailand: 'https://en.wikipedia.org/wiki/Visa_policy_of_Thailand',
  vietnam: 'https://en.wikipedia.org/wiki/Visa_policy_of_Vietnam',
  indonesia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Indonesia',
  malaysia: 'https://en.wikipedia.org/wiki/Visa_policy_of_Malaysia',
  japan: 'https://en.wikipedia.org/wiki/Visa_policy_of_Japan',
  southKorea: 'https://en.wikipedia.org/wiki/Visa_policy_of_South_Korea',
} as const;

const window90of180: StayRules = {kind: 'rolling_window', windowSizeDays: 180, maxStayDays: 90};
const window30of60: StayRules = {kind: 'rolling_window', windowSizeDays: 60, maxStayDays: 30};
// "N days in a (calendar) year" isn't modelled; a rolling year is never more permissive.
const perYear = (days: number): StayRules => ({kind: 'rolling_window', windowSizeDays: 365, maxStayDays: days});
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

// Rules for the zones added on 2026-10-16. All from secondary summaries, so they show as unverified.
const ME_90 = rule('visa_free', [window90of180], SRC.montenegro, 'secondary');
const RS_90 = rule('visa_free', [window90of180], SRC.serbia, 'secondary');
const AL_90 = rule('visa_free', [window90of180], SRC.albania, 'secondary');
const MK_90 = rule('visa_free', [window90of180], SRC.northMacedonia, 'secondary');
const MK_VISA = rule('visa_required', [window90of180], SRC.northMacedonia, 'secondary');
const BA_90 = rule('visa_free', [window90of180], SRC.bosnia, 'secondary');
const BA_30 = rule('visa_free', [window30of60], SRC.bosnia, 'secondary');
const XK_90 = rule('visa_free', [window90of180], SRC.kosovo, 'secondary');
const IE_FREE = rule('free', [], SRC.ireland, 'secondary');
const IE_90 = rule('visa_free', [perVisit(90)], SRC.ireland, 'secondary');
const IE_VISA = rule('visa_required', [perVisit(90)], SRC.ireland, 'secondary');
const AM_180 = rule('visa_free', [perYear(180)], SRC.armenia, 'secondary');
const AM_ON_ARRIVAL = rule('visa_on_arrival', [perVisit(120)], SRC.armenia, 'secondary');
const AZ_EVISA = rule('visa_required', [perVisit(30)], SRC.azerbaijan, 'secondary', ['evisa']);
// 30 days per visit, and no more than 90 within any 180 days counted from the first entry.
const KZ_30 = rule('visa_free', [perVisit(30), window90of180], SRC.kazakhstan, 'secondary');
const KZ_90 = rule('visa_free', [window90of180], SRC.kazakhstan, 'secondary');
const KG_30 = rule('visa_free', [window30of60], SRC.kyrgyzstan, 'secondary');
const KG_90 = rule('visa_free', [window90of180], SRC.kyrgyzstan, 'secondary');
const UZ_30 = rule('visa_free', [perVisit(30)], SRC.uzbekistan, 'secondary');
// Never needed a visa and no stay limit is listed (registration still applies).
const UZ_FREE = rule('free', [], SRC.uzbekistan, 'secondary');
const TH_30 = rule('visa_free', [perVisit(30)], SRC.thailand, 'secondary');
const VN_45 = rule('visa_free', [perVisit(45)], SRC.vietnam, 'secondary');
const VN_EVISA = rule('visa_required', [perVisit(90)], SRC.vietnam, 'secondary', ['evisa']);
const ID_ON_ARRIVAL = rule('visa_on_arrival', [perVisit(30)], SRC.indonesia, 'secondary');
const MY_90 = rule('visa_free', [perVisit(90)], SRC.malaysia, 'secondary');
const MY_30 = rule('visa_free', [perVisit(30)], SRC.malaysia, 'secondary');
const JP_90 = rule('visa_free', [perVisit(90)], SRC.japan, 'secondary');
const JP_VISA = rule('visa_required', [perVisit(90)], SRC.japan, 'secondary');
// K-ETA is waived for these passports until 31 December 2026.
const KR_90 = rule('visa_free', [perVisit(90)], SRC.southKorea, 'secondary');
const KR_VISA = rule('visa_required', [perVisit(90)], SRC.southKorea, 'secondary');

// Same rule for every passport that is visa-exempt on the common terms.
const BALKANS_90 = {montenegro: ME_90, serbia: RS_90, albania: AL_90, north_macedonia: MK_90, bosnia: BA_90, kosovo: XK_90};
const CENTRAL_ASIA_30 = {kazakhstan: KZ_30, kyrgyzstan: KG_30, uzbekistan: UZ_30};

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
    ...BALKANS_90,
    ireland: IE_FREE,
    armenia: AM_180,
    azerbaijan: AZ_EVISA,
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    // Exempt for most EU states; the rest need an e-visa (see PASSPORT_OVERRIDES).
    vietnam: VN_45,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_90,
    japan: JP_90,
    south_korea: KR_90,
  },
  GB: {
    schengen: EU_VISA_FREE,
    cyprus: EU_VISA_FREE,
    moldova: MOLDOVA,
    turkey: TURKEY,
    georgia: GEORGIA,
    egypt: EGYPT_ON_ARRIVAL,
    uae: UAE_90,
    ...BALKANS_90,
    // Common Travel Area.
    ireland: IE_FREE,
    armenia: AM_180,
    azerbaijan: AZ_EVISA,
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    vietnam: VN_45,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_90,
    japan: JP_90,
    south_korea: KR_90,
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
    ...BALKANS_90,
    // One year, then 90 days outside before re-entering.
    albania: rule('visa_free', [perVisit(365)], SRC.albania, 'secondary'),
    ireland: IE_90,
    armenia: AM_180,
    azerbaijan: AZ_EVISA,
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    vietnam: VN_EVISA,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_90,
    japan: JP_90,
    south_korea: KR_90,
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
    ...BALKANS_90,
    ireland: IE_90,
    armenia: AM_ON_ARRIVAL,
    azerbaijan: AZ_EVISA,
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    vietnam: VN_EVISA,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_90,
    japan: JP_90,
    south_korea: rule('visa_free', [sixMonths], SRC.southKorea, 'secondary'),
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
    ...BALKANS_90,
    ireland: IE_90,
    armenia: AM_180,
    azerbaijan: AZ_EVISA,
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    vietnam: VN_EVISA,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_90,
    japan: JP_90,
    south_korea: KR_90,
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
    ...BALKANS_90,
    ireland: IE_90,
    armenia: AM_ON_ARRIVAL,
    // e-Visa issued on arrival at international airports.
    azerbaijan: rule('visa_on_arrival', [perVisit(30)], SRC.azerbaijan, 'secondary'),
    ...CENTRAL_ASIA_30,
    thailand: TH_30,
    vietnam: VN_EVISA,
    // Calling visa with prior approval from the Directorate General of Immigration.
    indonesia: rule('visa_required', [perVisit(30)], SRC.indonesia, 'secondary'),
    // Visa plus Ministry of Home Affairs approval.
    malaysia: rule('visa_required', [perVisit(30)], SRC.malaysia, 'secondary'),
    japan: JP_90,
    south_korea: KR_90,
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
    ...BALKANS_90,
    // Biometric passports only.
    north_macedonia: MK_90,
    bosnia: BA_30,
    // Biometric passports only.
    ireland: IE_90,
    armenia: AM_180,
    azerbaijan: rule('visa_free', [perVisit(90)], SRC.azerbaijan, 'secondary'),
    kazakhstan: KZ_90,
    kyrgyzstan: KG_90,
    uzbekistan: UZ_FREE,
    thailand: TH_30,
    vietnam: VN_EVISA,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_30,
    japan: JP_VISA,
    south_korea: KR_VISA,
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
    // Visa-free for 30 days until 31 October 2026; a visa is required from 1 November 2026.
    montenegro: rule('visa_required', [perVisit(30)], SRC.montenegro, 'secondary'),
    serbia: rule('visa_free', [perVisit(30)], SRC.serbia, 'secondary'),
    albania: rule('visa_required', [window90of180], SRC.albania, 'secondary', ['evisa']),
    north_macedonia: MK_VISA,
    bosnia: BA_30,
    kosovo: rule('visa_required', [window90of180], SRC.kosovo, 'secondary'),
    ireland: IE_VISA,
    armenia: AM_180,
    // "No more than 90 days within 1 calendar year period."
    azerbaijan: rule('visa_free', [perYear(90)], SRC.azerbaijan, 'secondary'),
    kazakhstan: KZ_90,
    kyrgyzstan: KG_90,
    uzbekistan: UZ_FREE,
    thailand: TH_30,
    vietnam: VN_45,
    indonesia: ID_ON_ARRIVAL,
    malaysia: MY_30,
    japan: JP_VISA,
    // 60 days per visit and 90 within any 180; K-ETA is required.
    south_korea: rule('visa_free', [perVisit(60), window90of180], SRC.southKorea, 'secondary', ['eta']),
  },
};

// Single countries whose rule differs from their group; checked before PASSPORT_RULES.
export const PASSPORT_OVERRIDES: Partial<Record<string, Partial<Record<string, PassportRule>>>> = {
  // Common Travel Area: Irish citizens need no ETA or visa for the UK.
  IE: {
    uk: rule('free', [], SRC.ukPolicy, 'secondary'),
    uae: UAE_30,
    vietnam: VN_EVISA,
  },
  CY: {
    turkey: rule('visa_required', [window90of180], SRC.turkey, 'official'),
    vietnam: VN_EVISA,
    south_korea: rule('visa_free', [perVisit(30)], SRC.southKorea, 'secondary'),
  },
  // Not on Vietnam's visa-exemption list: e-visa.
  AT: {vietnam: VN_EVISA},
  EE: {vietnam: VN_EVISA},
  GR: {vietnam: VN_EVISA},
  LV: {vietnam: VN_EVISA},
  LT: {vietnam: VN_EVISA},
  MT: {vietnam: VN_EVISA},
  PT: {vietnam: VN_EVISA},
  IS: {vietnam: VN_EVISA},
  LI: {vietnam: VN_EVISA},
  NO: {vietnam: rule('visa_free', [perVisit(90)], SRC.vietnam, 'secondary')},
};
