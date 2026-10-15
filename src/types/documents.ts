import type { StayRules } from '../core/schengenCalculator';

// How a passport enters a zone, from most to least permissive.
export type AccessMode = 'free' | 'visa_free' | 'visa_on_arrival' | 'visa_required' | 'unknown';

export type Requirement = 'eta' | 'etias' | 'evisa' | 'insurance';

export interface PassportRule {
  mode: Exclude<AccessMode, 'free' | 'unknown'> | 'free';
  // All must hold. For visa_required this is the upper bound until the user adds the visa itself.
  constraints: StayRules[];
  requires?: Requirement[];
  // Official page the rule was checked against; null until verified.
  source: string | null;
  verifiedAt: string | null;
}

// A status that lets the holder live in a country: days there don't count toward the zone limit.
// national_visa_d: long-stay national visa of a Schengen/EU state — same effect as a residence permit there.
export type ResidenceKind = 'residence_permit' | 'temporary_protection' | 'national_visa_d';

export interface ResidenceDoc {
  countryCode: string;
  kind: ResidenceKind;
  validUntil: string | null;
}
