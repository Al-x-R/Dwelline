import dayjs from 'dayjs';
import type { Trip } from '../types/Trip';

const DEFAULT_WINDOW_SIZE = 180;
const DEFAULT_MAX_STAY = 90;

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

export function calculateCompliance(
    trips: Trip[],
    zoneId: string,
    today: string = dayjs().format('YYYY-MM-DD'),
    windowSizeDays: number = DEFAULT_WINDOW_SIZE,
    maxStayDays: number = DEFAULT_MAX_STAY
): {
    daysUsed: number;
    daysRemaining: number;
    isViolation: boolean;
    windowStart: string;
    windowEnd: string;
} {
    const presence = buildPresenceSet(trips, zoneId, today);
    const daysUsed = countDaysInWindow(presence, today, windowSizeDays);
    const windowStart = dayjs(today).subtract(windowSizeDays - 1, 'day').format('YYYY-MM-DD');

    return {
        daysUsed,
        daysRemaining: Math.max(0, maxStayDays - daysUsed),
        isViolation: daysUsed > maxStayDays,
        windowStart,
        windowEnd: today,
    };
}

export function simulateTrip(
    trips: Trip[],
    zoneId: string,
    hypotheticalStart: string,
    durationDays: number,
    windowSizeDays: number = DEFAULT_WINDOW_SIZE,
    maxStayDays: number = DEFAULT_MAX_STAY
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
        const daysUsed = countDaysInWindow(presence, dateStr, windowSizeDays);
        const overage = daysUsed - maxStayDays;
        if (overage > maxOverage) maxOverage = overage;

        dailyStatus.push({ date: dateStr, daysUsed, isViolation: daysUsed > maxStayDays });
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
    windowSizeDays: number = DEFAULT_WINDOW_SIZE,
    maxStayDays: number = DEFAULT_MAX_STAY
): string | null {
    const hasOpenTrip = trips.some((t) => t.zoneId === zoneId && t.exitDate === null);
    if (!hasOpenTrip) return null;

    let cursor = dayjs(today);
    for (let i = 0; i < 365; i++) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const presence = buildPresenceSet(trips, zoneId, dateStr);
        const daysUsed = countDaysInWindow(presence, dateStr, windowSizeDays);
        if (daysUsed > maxStayDays) {
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
    windowSizeDays: number = DEFAULT_WINDOW_SIZE,
    maxStayDays: number = DEFAULT_MAX_STAY
): { date: string; days: number } | null {
    let cursor = dayjs(startDate);
    let lastSafeDate: string | null = null;
    let daysCount = 0;

    for (let i = 0; i < 400; i++) {
        const dateStr = cursor.format('YYYY-MM-DD');
        const hypotheticalTrip: Trip = {
            id: '__hypothetical__',
            zoneId,
            countryCode: 'XX',
            entryDate: startDate,
            exitDate: dateStr,
        };
        const presence = buildPresenceSet([...trips, hypotheticalTrip], zoneId, dateStr);
        const daysUsed = countDaysInWindow(presence, dateStr, windowSizeDays);

        if (daysUsed > maxStayDays) break;

        lastSafeDate = dateStr;
        daysCount = i + 1;
        cursor = cursor.add(1, 'day');
    }

    return lastSafeDate ? { date: lastSafeDate, days: daysCount } : null;
}