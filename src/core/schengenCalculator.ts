import dayjs from 'dayjs';
import type { Trip } from '../types/Trip';

// rolling_window: at most maxStayDays within any windowSizeDays-day period (Schengen 90/180).
// per_visit: at most maxStayDays of one continuous stay; leaving the zone resets the counter.
export type StayRuleKind = 'rolling_window' | 'per_visit';

export interface StayRules {
    kind: StayRuleKind;
    windowSizeDays: number;
    maxStayDays: number;
    // per_visit only: limit in calendar months from entry (UK, 6 months); overrides maxStayDays.
    maxStayMonths?: number;
}

export const SCHENGEN_RULES: StayRules = { kind: 'rolling_window', windowSizeDays: 180, maxStayDays: 90 };

// Searches look this far ahead; must exceed the longest per-visit limit (Georgia, 365 days).
const SEARCH_HORIZON_DAYS = 800;

function getTripDates(trip: Trip, todayIfOpen: string): string[] {
    const start = dayjs(trip.entryDate);
    const end = trip.exitDate ? dayjs(trip.exitDate) : dayjs(todayIfOpen);

    const dates: string[] = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        dates.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'day');
    }
    return dates;
}

export function buildPresenceSet(trips: Trip[], zoneId: string, todayIfOpen: string): Set<string> {
    const presence = new Set<string>();
    for (const trip of trips) {
        if (trip.zoneId !== zoneId) continue;
        const dates = getTripDates(trip, todayIfOpen);
        for (const d of dates) presence.add(d);
    }
    return presence;
}

export function countDaysInWindow(presence: Set<string>, checkDate: string, windowSizeDays: number): number {
    const end = dayjs(checkDate);
    const start = end.subtract(windowSizeDays - 1, 'day');

    let count = 0;
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        if (presence.has(cursor.format('YYYY-MM-DD'))) count++;
        cursor = cursor.add(1, 'day');
    }
    return count;
}

// Start of the continuous stay that includes checkDate (checkDate itself if not in the zone).
export function visitStart(presence: Set<string>, checkDate: string): string {
    let cursor = dayjs(checkDate);
    while (presence.has(cursor.subtract(1, 'day').format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day');
    return cursor.format('YYYY-MM-DD');
}

function countVisitDays(presence: Set<string>, checkDate: string): number {
    if (!presence.has(checkDate)) return 0;
    return dayjs(checkDate).diff(dayjs(visitStart(presence, checkDate)), 'day') + 1;
}

// Days counted against the limit on checkDate.
export function countUsedDays(presence: Set<string>, checkDate: string, rules: StayRules): number {
    return rules.kind === 'per_visit'
        ? countVisitDays(presence, checkDate)
        : countDaysInWindow(presence, checkDate, rules.windowSizeDays);
}

// Limit that applies on checkDate. Fixed, except for month-based visits where it depends on the entry date.
export function stayLimit(presence: Set<string>, checkDate: string, rules: StayRules): number {
    if (rules.kind !== 'per_visit' || !rules.maxStayMonths) return rules.maxStayDays;
    const start = dayjs(visitStart(presence, checkDate));
    return start.add(rules.maxStayMonths, 'month').diff(start, 'day');
}

// First day of the period that daysUsed refers to: the rolling window or the current visit.
export function usagePeriodStart(presence: Set<string>, checkDate: string, rules: StayRules): string {
    return rules.kind === 'per_visit'
        ? visitStart(presence, checkDate)
        : dayjs(checkDate).subtract(rules.windowSizeDays - 1, 'day').format('YYYY-MM-DD');
}

export function calculateCompliance(
    trips: Trip[],
    zoneId: string,
    today: string = dayjs().format('YYYY-MM-DD'),
    rules: StayRules = SCHENGEN_RULES
): {
    daysUsed: number;
    daysRemaining: number;
    isViolation: boolean;
    windowStart: string;
    windowEnd: string;
} {
    const presence = buildPresenceSet(trips, zoneId, today);
    const daysUsed = countUsedDays(presence, today, rules);
    const limit = stayLimit(presence, today, rules);

    return {
        daysUsed,
        daysRemaining: Math.max(0, limit - daysUsed),
        isViolation: daysUsed > limit,
        windowStart: usagePeriodStart(presence, today, rules),
        windowEnd: today,
    };
}

export function simulateTrip(
    trips: Trip[],
    zoneId: string,
    hypotheticalStart: string,
    durationDays: number,
    rules: StayRules = SCHENGEN_RULES
): {
    isViolation: boolean;
    maxOverageDays: number;
    dailyStatus: { date: string; daysUsed: number; isViolation: boolean }[];
} {
    const hypotheticalTrip: Trip = {
        id: '__hypothetical__',
        zoneId,
        countryCode: 'XX',
        entryDate: hypotheticalStart,
        exitDate: dayjs(hypotheticalStart).add(durationDays - 1, 'day').format('YYYY-MM-DD'),
    };

    const allTrips = [...trips, hypotheticalTrip];
    const lastDay = hypotheticalTrip.exitDate!;
    const presence = buildPresenceSet(allTrips, zoneId, lastDay);

    const dailyStatus: { date: string; daysUsed: number; isViolation: boolean }[] = [];
    let cursor = dayjs(hypotheticalStart);
    const end = dayjs(lastDay);
    let maxOverage = 0;

    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const daysUsed = countUsedDays(presence, dateStr, rules);
        const overage = daysUsed - stayLimit(presence, dateStr, rules);
        if (overage > maxOverage) maxOverage = overage;

        dailyStatus.push({ date: dateStr, daysUsed, isViolation: overage > 0 });
        cursor = cursor.add(1, 'day');
    }

    return {
        isViolation: maxOverage > 0,
        maxOverageDays: Math.max(0, maxOverage),
        dailyStatus,
    };
}

export function findExitDeadline(
    trips: Trip[],
    zoneId: string,
    today: string = dayjs().format('YYYY-MM-DD'),
    rules: StayRules = SCHENGEN_RULES
): string | null {
    const hasOpenTrip = trips.some((t) => t.zoneId === zoneId && t.exitDate === null);
    if (!hasOpenTrip) return null;

    let cursor = dayjs(today);
    for (let i = 0; i < SEARCH_HORIZON_DAYS; i++) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const presence = buildPresenceSet(trips, zoneId, dateStr);
        const daysUsed = countUsedDays(presence, dateStr, rules);
        if (daysUsed > stayLimit(presence, dateStr, rules)) {
            return cursor.subtract(1, 'day').format('YYYY-MM-DD');
        }
        cursor = cursor.add(1, 'day');
    }
    return null;
}

export function findMaxStayFromDate(
    trips: Trip[],
    zoneId: string,
    startDate: string,
    rules: StayRules = SCHENGEN_RULES
): { date: string; days: number } | null {
    let cursor = dayjs(startDate);
    let lastSafeDate: string | null = null;
    let daysCount = 0;

    for (let i = 0; i < SEARCH_HORIZON_DAYS; i++) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const hypotheticalTrip: Trip = {
            id: '__hypothetical__',
            zoneId,
            countryCode: 'XX',
            entryDate: startDate,
            exitDate: dateStr,
        };
        const presence = buildPresenceSet([...trips, hypotheticalTrip], zoneId, dateStr);
        const daysUsed = countUsedDays(presence, dateStr, rules);

        if (daysUsed > stayLimit(presence, dateStr, rules)) break;

        lastSafeDate = dateStr;
        daysCount = i + 1;
        cursor = cursor.add(1, 'day');
    }

    return lastSafeDate ? { date: lastSafeDate, days: daysCount } : null;
}