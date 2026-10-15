import dayjs from 'dayjs';

import type { ZoneConfig } from '../constants/zones';
import { PASSPORT_RULES, passportGroup, TEMPORARY_PROTECTION_CODES, TEMPORARY_PROTECTION_UNTIL } from '../constants/passportRules';
import type { AccessMode, Requirement, ResidenceDoc, ResidenceKind } from '../types/documents';
import type { Trip } from '../types/Trip';
import type { StayRules } from './schengenCalculator';
import { todayIso, zoneRules } from './zoneAnalytics';

// Days in this country don't count toward the zone limit (until the date, inclusive, if set).
export interface Exemption {
  countryCode: string;
  kind: ResidenceKind;
  until: string | null;
}

export type AccessBasis = 'citizen' | 'passport' | 'residence' | 'zone_default';

export interface ZoneAccess {
  mode: AccessMode;
  constraints: StayRules[];
  requires: Requirement[];
  basis: AccessBasis;
  // Passport the rule comes from; null when it doesn't depend on one.
  passport: string | null;
  exemptions: Exemption[];
  verified: boolean;
}

export interface TravelDocuments {
  passports: string[];
  residences: ResidenceDoc[];
}

const RANK: Record<AccessMode, number> = {free: 4, visa_free: 3, visa_on_arrival: 2, visa_required: 1, unknown: 0};

// Within the same mode, the passport with the longer allowed stay wins.
function shortestLimit(constraints: StayRules[]): number {
  return constraints.length ? Math.min(...constraints.map((c) => c.maxStayDays)) : Infinity;
}

function better(a: ZoneAccess, b: ZoneAccess): ZoneAccess {
  if (RANK[a.mode] !== RANK[b.mode]) return RANK[a.mode] > RANK[b.mode] ? a : b;
  return shortestLimit(a.constraints) >= shortestLimit(b.constraints) ? a : b;
}

function zoneDefault(zone: ZoneConfig, mode: AccessMode): ZoneAccess {
  return {
    mode,
    constraints: [zoneRules(zone)],
    requires: [],
    basis: 'zone_default',
    passport: null,
    exemptions: [],
    verified: false,
  };
}

function passportAccess(zone: ZoneConfig, passport: string): ZoneAccess {
  if (zone.countryCodes.includes(passport)) {
    return {...zoneDefault(zone, 'free'), constraints: [], basis: 'citizen', passport, verified: true};
  }
  const group = passportGroup(passport);
  const rule = group ? PASSPORT_RULES[group][zone.id] : undefined;
  if (!rule) return {...zoneDefault(zone, 'unknown'), passport};
  return {
    mode: rule.mode,
    constraints: rule.constraints,
    requires: rule.requires ?? [],
    basis: 'passport',
    passport,
    exemptions: [],
    verified: rule.verifiedAt !== null,
  };
}

function exemptionsFor(zone: ZoneConfig, residences: ResidenceDoc[]): Exemption[] {
  return residences.flatMap((doc): Exemption[] => {
    if (!zone.countryCodes.includes(doc.countryCode)) return [];
    if (doc.kind === 'temporary_protection') {
      if (!TEMPORARY_PROTECTION_CODES.includes(doc.countryCode)) return [];
      return [{countryCode: doc.countryCode, kind: doc.kind, until: doc.validUntil ?? TEMPORARY_PROTECTION_UNTIL}];
    }
    return [{countryCode: doc.countryCode, kind: doc.kind, until: doc.validUntil}];
  });
}

export function resolveZoneAccess(zone: ZoneConfig, docs: TravelDocuments, today: string = todayIso()): ZoneAccess {
  // Custom zones carry the user's own rule.
  if (zone.isCustom) return {...zoneDefault(zone, 'visa_free'), verified: true};

  const best = docs.passports.length
    ? docs.passports.map((p) => passportAccess(zone, p)).reduce(better)
    : zoneDefault(zone, 'unknown');
  if (best.mode === 'free') return best;

  const exemptions = exemptionsFor(zone, docs.residences);
  // A valid status in every country of the zone means no limit right now; constraints still apply after it ends.
  const coversZone = zone.countryCodes.every((code) =>
    exemptions.some((e) => e.countryCode === code && (e.until === null || e.until >= today))
  );
  return coversZone ? {...best, mode: 'free', basis: 'residence', exemptions} : {...best, exemptions};
}

// Drops (or clips) trip days covered by an exemption, so the calculator never sees them.
export function applyExemptions(trips: Trip[], exemptions: Exemption[]): Trip[] {
  if (!exemptions.length) return trips;
  return trips.flatMap((trip) => {
    const exemption = exemptions.find((e) => e.countryCode === trip.countryCode);
    if (!exemption) return [trip];
    if (exemption.until === null) return [];
    if (trip.entryDate > exemption.until) return [trip];
    if (trip.exitDate !== null && trip.exitDate <= exemption.until) return [];
    return [{...trip, entryDate: dayjs(exemption.until).add(1, 'day').format('YYYY-MM-DD')}];
  });
}
