import dayjs from 'dayjs';

import type { Trip } from '../types/Trip';
import type { ZoneConfig } from '../constants/zones';
import {
  buildPresenceSet,
  calculateCompliance,
  countUsedDays,
  findExitDeadline,
  findMaxStayFromDate,
  SCHENGEN_RULES,
  simulateTrip,
  usagePeriodStart,
  type StayRules,
} from './schengenCalculator';

const ISO = 'YYYY-MM-DD';

export type ZoneTone = 'safe' | 'warning' | 'danger';

export type ZoneRules = StayRules;

export function zoneRules(zone: ZoneConfig | undefined): ZoneRules {
  if (zone?.ruleType === 'per_visit') {
    const maxStayDays = zone.maxStayDays ?? SCHENGEN_RULES.maxStayDays;
    // No rolling window: windowSizeDays only mirrors the limit so window-based math stays bounded.
    return {kind: 'per_visit', windowSizeDays: maxStayDays, maxStayDays};
  }
  return {
    kind: 'rolling_window',
    windowSizeDays: zone?.windowSizeDays ?? SCHENGEN_RULES.windowSizeDays,
    maxStayDays: zone?.maxStayDays ?? SCHENGEN_RULES.maxStayDays,
  };
}

export function isPerVisit(rules: ZoneRules): boolean {
  return rules.kind === 'per_visit';
}

export function todayIso(): string {
  return dayjs().format(ISO);
}

export function toneFor(daysUsed: number, maxStayDays: number, bufferDays: number): ZoneTone {
  if (daysUsed > maxStayDays) return 'danger';
  if (maxStayDays - daysUsed <= bufferDays) return 'warning';
  return 'safe';
}

export interface ZoneSummary {
  rules: ZoneRules;
  daysUsed: number;
  daysRemaining: number;
  isViolation: boolean;
  windowStart: string;
  windowEnd: string;
  tone: ZoneTone;
  // Nearest date when the oldest day in the window stops counting (rolling_window only).
  nextRollOff: string | null;
  // Date when the window is fully cleared of past trips (rolling_window only).
  fullReset: string | null;
  // Latest exit date if the user is currently inside the zone.
  exitDeadline: string | null;
  nextPlannedTrip: Trip | null;
  tripsCount: number;
}

export function summarizeZone(
  trips: Trip[],
  zone: ZoneConfig | undefined,
  bufferDays: number,
  today: string = todayIso(),
  rules: ZoneRules = zoneRules(zone)
): ZoneSummary {
  const zoneId = zone?.id ?? '';
  const compliance = calculateCompliance(trips, zoneId, today, rules);
  const presence = buildPresenceSet(trips, zoneId, today);

  let earliestInWindow: string | null = null;
  let latestPast: string | null = null;
  for (const day of presence) {
    if (day > today) continue;
    if (day >= compliance.windowStart && (!earliestInWindow || day < earliestInWindow)) earliestInWindow = day;
    if (!latestPast || day > latestPast) latestPast = day;
  }

  const nextPlannedTrip =
    trips
      .filter((t) => t.zoneId === zoneId && t.entryDate > today)
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate))[0] ?? null;

  const rolling = !isPerVisit(rules);

  return {
    rules,
    ...compliance,
    tone: toneFor(compliance.daysUsed, rules.maxStayDays, bufferDays),
    nextRollOff: rolling && earliestInWindow ? dayjs(earliestInWindow).add(rules.windowSizeDays, 'day').format(ISO) : null,
    fullReset: rolling && latestPast ? dayjs(latestPast).add(rules.windowSizeDays, 'day').format(ISO) : null,
    exitDeadline: findExitDeadline(trips, zoneId, today, rules),
    nextPlannedTrip,
    tripsCount: trips.filter((t) => t.zoneId === zoneId).length,
  };
}

export interface DayInfo {
  date: string;
  inZone: boolean;
  // On this day one of the past days drops out of the window and is freed up.
  rollOff: boolean;
}

export function presenceFor(trips: Trip[], zoneId: string, today: string = todayIso()): Set<string> {
  return buildPresenceSet(trips, zoneId, today);
}

export function dayInfo(presence: Set<string>, date: string, rules: ZoneRules): DayInfo {
  if (isPerVisit(rules)) return {date, inZone: presence.has(date), rollOff: false};
  const expired = dayjs(date).subtract(rules.windowSizeDays, 'day').format(ISO);
  return {date, inZone: presence.has(date), rollOff: presence.has(expired)};
}

export function windowUsage(presence: Set<string>, date: string, rules: ZoneRules) {
  const daysUsed = countUsedDays(presence, date, rules);
  return {
    daysUsed,
    daysRemaining: Math.max(0, rules.maxStayDays - daysUsed),
    isViolation: daysUsed > rules.maxStayDays,
    windowStart: usagePeriodStart(presence, date, rules),
    windowEnd: date,
  };
}

export interface SimulationResult {
  entryDate: string;
  exitDate: string;
  isViolation: boolean;
  overageDays: number;
  daysUsedAtExit: number;
  reserveAtExit: number;
  maxContinuousDays: number;
  criticalExitDate: string | null;
  windowStartAtExit: string;
  usedBeforeTrip: number;
  freedDuringTrip: number;
  firstRollOffDate: string | null;
}

export function simulateStay(
  trips: Trip[],
  zone: ZoneConfig | undefined,
  entryDate: string,
  durationDays: number,
  rules: ZoneRules = zoneRules(zone)
): SimulationResult {
  const zoneId = zone?.id ?? '';
  const exitDate = dayjs(entryDate).add(durationDays - 1, 'day').format(ISO);
  const simulation = simulateTrip(trips, zoneId, entryDate, durationDays, rules);
  const maxStay = findMaxStayFromDate(trips, zoneId, entryDate, rules);

  const existing = buildPresenceSet(trips, zoneId, entryDate);
  const lastDay = simulation.dailyStatus[simulation.dailyStatus.length - 1];
  const daysUsedAtExit = lastDay?.daysUsed ?? 0;
  const dayBeforeEntry = dayjs(entryDate).subtract(1, 'day').format(ISO);
  const perVisit = isPerVisit(rules);
  // per_visit: only a stay that runs right up to the entry date continues into this trip.
  const usedBeforeTrip = countUsedDays(existing, perVisit ? dayBeforeEntry : exitDate, rules);
  const usedAtEntry = countUsedDays(existing, dayBeforeEntry, rules);

  let firstRollOffDate: string | null = null;
  let cursor = dayjs(entryDate);
  for (let i = 0; i < (perVisit ? 0 : durationDays); i++) {
    const expired = cursor.subtract(rules.windowSizeDays, 'day').format(ISO);
    if (existing.has(expired)) {
      firstRollOffDate = cursor.format(ISO);
      break;
    }
    cursor = cursor.add(1, 'day');
  }

  return {
    entryDate,
    exitDate,
    isViolation: simulation.isViolation,
    overageDays: simulation.maxOverageDays,
    daysUsedAtExit,
    reserveAtExit: Math.max(0, rules.maxStayDays - daysUsedAtExit),
    maxContinuousDays: maxStay?.days ?? 0,
    criticalExitDate: maxStay?.date ?? null,
    windowStartAtExit: perVisit
      ? dayjs(entryDate).subtract(usedBeforeTrip, 'day').format(ISO)
      : dayjs(exitDate).subtract(rules.windowSizeDays - 1, 'day').format(ISO),
    usedBeforeTrip,
    freedDuringTrip: perVisit ? 0 : Math.max(0, usedAtEntry - usedBeforeTrip),
    firstRollOffDate,
  };
}

export function tripDaysCount(trip: Trip, today: string = todayIso()): number {
  const end = trip.exitDate ?? (trip.entryDate > today ? trip.entryDate : today);
  return Math.max(1, dayjs(end).diff(dayjs(trip.entryDate), 'day') + 1);
}
