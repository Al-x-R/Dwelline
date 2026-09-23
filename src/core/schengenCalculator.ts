import dayjs from 'dayjs';
import type { Trip } from '../types/Trip';

const WINDOW_SIZE = 180;
const MAX_STAY = 90;

/**
 * Returns all calendar dates (YYYY-MM-DD) of a trip, inclusive.
 * Both entry and exit days count as full presence days (per official EU rules).
 */
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

/**
 * Builds a set of all presence days in the given zone.
 * Automatically deduplicates overlapping or adjacent trips.
 */
function buildPresenceSet(trips: Trip[], zoneId: string, todayIfOpen: string): Set<string> {
    const presence = new Set<string>();
    for (const trip of trips) {
        if (trip.zoneId !== zoneId) continue;
        const dates = getTripDates(trip, todayIfOpen);
        for (const d of dates) presence.add(d);
    }
    return presence;
}

/**
 * Counts presence days in the 180-day rolling window ending on checkDate (inclusive).
 * Core logic of the 90/180 rule.
 */
function countDaysInWindow(presence: Set<string>, checkDate: string): number {
    const end = dayjs(checkDate);
    const start = end.subtract(WINDOW_SIZE - 1, 'day'); // window includes 180 days, including checkDate

    let count = 0;
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        if (presence.has(cursor.format('YYYY-MM-DD'))) count++;
        cursor = cursor.add(1, 'day');
    }
    return count;
}

/**
 * Returns current compliance status for the zone as of `today`.
 */
export function calculateCompliance(trips: Trip[], zoneId: string, today: string = dayjs().format('YYYY-MM-DD')): {
    daysUsed: number;
    daysRemaining: number;
    isViolation: boolean;
    windowStart: string;
    windowEnd: string;
} {
    const presence = buildPresenceSet(trips, zoneId, today);
    const daysUsed = countDaysInWindow(presence, today);
    const windowStart = dayjs(today).subtract(WINDOW_SIZE - 1, 'day').format('YYYY-MM-DD');

    return {
        daysUsed,
        daysRemaining: Math.max(0, MAX_STAY - daysUsed),
        isViolation: daysUsed > MAX_STAY,
        windowStart,
        windowEnd: today,
    };
}

/**
 * Simulates adding a hypothetical trip and checks for overage.
 * Recalculates the window for every day of the trip to catch mid-trip violations.
 */
export function simulateTrip(
    trips: Trip[],
    zoneId: string,
    hypotheticalStart: string,
    durationDays: number
): {
    isViolation: boolean;
    maxOverageDays: number;
    dailyStatus: { date: string; daysUsed: number; isViolation: boolean }[];
} {
    const hypotheticalTrip: Trip = {
        id: '__hypothetical__',
        zoneId: zoneId as Trip['zoneId'],
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
        const daysUsed = countDaysInWindow(presence, dateStr);
        const overage = daysUsed - MAX_STAY;
        if (overage > maxOverage) maxOverage = overage;

        dailyStatus.push({ date: dateStr, daysUsed, isViolation: daysUsed > MAX_STAY });
        cursor = cursor.add(1, 'day');
    }

    return {
        isViolation: maxOverage > 0,
        maxOverageDays: Math.max(0, maxOverage),
        dailyStatus,
    };
}

/**
 * Finds the latest allowed exit date for an open trip in the zone.
 * Returns null if there is no open trip.
 */
export function findExitDeadline(trips: Trip[], zoneId: string, today: string = dayjs().format('YYYY-MM-DD')): string | null {
    const hasOpenTrip = trips.some((t) => t.zoneId === zoneId && t.exitDate === null);
    if (!hasOpenTrip) return null;

    let cursor = dayjs(today);
    // Limit search to 1 year ahead to avoid infinite loops
    for (let i = 0; i < 365; i++) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const presence = buildPresenceSet(trips, zoneId, dateStr);
        const daysUsed = countDaysInWindow(presence, dateStr);
        if (daysUsed > MAX_STAY) {
            return cursor.subtract(1, 'day').format('YYYY-MM-DD');
        }
        cursor = cursor.add(1, 'day');
    }
    return null;
}