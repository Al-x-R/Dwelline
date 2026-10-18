import dayjs from 'dayjs';

import { NO_ZONE, type ZoneConfig } from '../../constants/zones';
import { zoneContext, type TravelDocuments } from '../../core/zoneAccess';
import type { StayRules } from '../../core/schengenCalculator';
import { isPerVisit, summarizeZone, tripDaysCount, type ZoneTone } from '../../core/zoneAnalytics';
import type { ResidenceDoc } from '../../types/documents';
import type { Trip } from '../../types/Trip';

// Trips are listed for this long back: covers the Schengen 180-day window and per-year rules with room to spare.
export const REPORT_HISTORY_DAYS = 365;

export interface ReportZone {
  zone: ZoneConfig;
  // No limit: free movement or a valid residence status for the whole zone.
  free: boolean;
  // Rules that apply with the traveller's passports, extras included.
  rules: StayRules;
  perVisit: boolean;
  daysUsed: number;
  maxDays: number;
  daysRemaining: number;
  periodStart: string;
  periodEnd: string;
  isViolation: boolean;
  overageDays: number;
  // Latest exit date while the traveller is inside the zone.
  exitDeadline: string | null;
  tone: ZoneTone;
}

export interface ReportTrip {
  countryCode: string;
  zone: ZoneConfig | null;
  entryDate: string;
  exitDate: string | null;
  days: number;
  planned: boolean;
}

export interface ReportModel {
  today: string;
  historyStart: string;
  passports: string[];
  residences: ResidenceDoc[];
  zones: ReportZone[];
  trips: ReportTrip[];
}

export interface ReportInput {
  trips: Trip[];
  // Zones the user tracks, in their order.
  zones: ZoneConfig[];
  // Every zone, to label trips in zones that aren't tracked.
  allZones: ZoneConfig[];
  docs: TravelDocuments;
  bufferDays: number;
  today: string;
}

// Stays in one country that overlap or follow each other day to day are one stay at the border, however they were
// entered (a duplicated route, a route split into legs). Day counts already merge them; this keeps the list in step.
export function mergeStays(trips: Trip[], today: string): Trip[] {
  const end = (t: Trip) => t.exitDate ?? (t.entryDate > today ? t.entryDate : today);
  const sorted = [...trips].sort((a, b) => a.countryCode.localeCompare(b.countryCode)
    || a.zoneId.localeCompare(b.zoneId)
    || a.entryDate.localeCompare(b.entryDate));
  const merged: Trip[] = [];
  for (const trip of sorted) {
    const last = merged[merged.length - 1];
    const continues = last && last.countryCode === trip.countryCode && last.zoneId === trip.zoneId
      && trip.entryDate <= dayjs(end(last)).add(1, 'day').format('YYYY-MM-DD');
    if (!continues) {
      merged.push({...trip});
      continue;
    }
    if (last.exitDate === null || trip.exitDate === null) last.exitDate = null;
    else if (trip.exitDate > last.exitDate) last.exitDate = trip.exitDate;
  }
  return merged.sort((a, b) => a.entryDate.localeCompare(b.entryDate));
}

export function buildReportModel({trips, zones, allZones, docs, bufferDays, today}: ReportInput): ReportModel {
  const historyStart = dayjs(today).subtract(REPORT_HISTORY_DAYS - 1, 'day').format('YYYY-MM-DD');
  const recent = mergeStays(trips.filter((t) => t.exitDate === null || t.exitDate >= historyStart), today);

  // A tracked zone with nothing in the period is noise on a document meant for a border check.
  const zonesWithTrips = zones.filter((z) => recent.some((t) => t.zoneId === z.id));

  return {
    today,
    historyStart,
    passports: docs.passports,
    residences: docs.residences,
    zones: zonesWithTrips.map((zone) => {
      const ctx = zoneContext(zone, trips, docs, today);
      const summary = summarizeZone(ctx.trips, zone, bufferDays, today, ctx.rules);
      return {
        zone,
        free: ctx.access.mode === 'free',
        rules: summary.rules,
        perVisit: isPerVisit(summary.rules),
        daysUsed: summary.daysUsed,
        maxDays: summary.rules.maxStayDays,
        daysRemaining: summary.daysRemaining,
        periodStart: summary.windowStart,
        periodEnd: summary.windowEnd,
        isViolation: summary.isViolation,
        overageDays: summary.overageDays,
        exitDeadline: summary.exitDeadline,
        tone: summary.tone,
      };
    }),
    trips: recent.map((t) => ({
      countryCode: t.countryCode,
      zone: t.zoneId === NO_ZONE ? null : allZones.find((z) => z.id === t.zoneId) ?? null,
      entryDate: t.entryDate,
      exitDate: t.exitDate,
      days: tripDaysCount(t, today),
      planned: t.entryDate > today,
    })),
  };
}
