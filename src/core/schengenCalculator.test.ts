import { calculateCompliance, simulateTrip, findExitDeadline, findMaxStayFromDate, type StayRules } from './schengenCalculator';
import type { Trip } from '../types/Trip';

describe('calculateCompliance', () => {
    it('returns 0 days used when there are no trips', () => {
        const result = calculateCompliance([], 'schengen', '2026-06-01');
        expect(result.daysUsed).toBe(0);
        expect(result.isViolation).toBe(false);
    });

    it('counts both entry and exit days as full presence days', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: '2026-01-05' },
        ];
        // Jan 1–5 = 5 days
        const result = calculateCompliance(trips, 'schengen', '2026-06-01');
        expect(result.daysUsed).toBe(5);
    });

    it('deduplicates overlapping or adjacent trips on the same day', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: '2026-01-05' },
            { id: '2', zoneId: 'schengen', countryCode: 'DE', entryDate: '2026-01-05', exitDate: '2026-01-10' },
        ];
        // Jan 1–10 = 10 days (not 11), because Jan 5 overlaps
        const result = calculateCompliance(trips, 'schengen', '2026-06-01');
        expect(result.daysUsed).toBe(10);
    });

    it('correctly counts an open trip ("still there") up to today', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: null },
        ];
        const result = calculateCompliance(trips, 'schengen', '2026-01-10');
        expect(result.daysUsed).toBe(10); // Jan 1–10 inclusive
    });

    it('only counts days that fall inside the 180-day rolling window', () => {
        const trips: Trip[] = [
            // 100-day trip that started well before the window
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2025-10-01', exitDate: '2026-01-08' },
        ];
        // Window for 2026-01-15: 2025-07-19 → 2026-01-15
        // Entire trip falls inside the window = 100 days
        const result = calculateCompliance(trips, 'schengen', '2026-01-15');
        expect(result.daysUsed).toBe(100);
    });

    it('flags a violation when more than 90 days are used', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: '2026-04-10' }, // 100 days
        ];
        const result = calculateCompliance(trips, 'schengen', '2026-04-10');
        expect(result.isViolation).toBe(true);
        expect(result.daysUsed).toBe(100);
        expect(result.daysRemaining).toBe(0); // must not go negative
    });

    it('ignores trips from other zones', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uk', countryCode: 'GB', entryDate: '2026-01-01', exitDate: '2026-01-20' },
        ];
        const result = calculateCompliance(trips, 'schengen', '2026-06-01');
        expect(result.daysUsed).toBe(0);
    });
});

describe('simulateTrip', () => {
    it('does not report a violation when the hypothetical trip fits within the limit', () => {
        const result = simulateTrip([], 'schengen', '2026-11-10', 12);
        expect(result.isViolation).toBe(false);
        expect(result.maxOverageDays).toBe(0);
    });

    it('detects overage caused by previously used days (domino effect)', () => {
        const trips: Trip[] = [
            // 85 days already used in the recent past
            { id: '1', zoneId: 'schengen', countryCode: 'ES', entryDate: '2026-08-01', exitDate: '2026-10-24' },
        ];
        // Planning another 12 days in November should exceed the limit
        const result = simulateTrip(trips, 'schengen', '2026-11-10', 12);
        expect(result.isViolation).toBe(true);
        expect(result.maxOverageDays).toBeGreaterThan(0);
    });
});

describe('findExitDeadline', () => {
    it('returns null when there is no open trip', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: '2026-01-05' },
        ];
        expect(findExitDeadline(trips, 'schengen', '2026-06-01')).toBeNull();
    });

    it('finds the last safe exit day for an open trip', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: null },
        ];
        const deadline = findExitDeadline(trips, 'schengen', '2026-01-01');
        // 90th day from Jan 1 = March 31, 2026
        expect(deadline).toBe('2026-03-31');
    });
});
describe('per_visit rules', () => {
    const georgia: StayRules = { kind: 'per_visit', windowSizeDays: 365, maxStayDays: 365 };
    const uae: StayRules = { kind: 'per_visit', windowSizeDays: 30, maxStayDays: 30 };

    it('counts only the current continuous stay', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-01-01', exitDate: '2026-01-25' },
            { id: '2', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-02-01', exitDate: null },
        ];
        // Feb 1–10 = 10 days; the January visit does not count
        const result = calculateCompliance(trips, 'uae', '2026-02-10', uae);
        expect(result.daysUsed).toBe(10);
        expect(result.windowStart).toBe('2026-02-01');
    });

    it('returns 0 days used when outside the zone', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-01-01', exitDate: '2026-01-25' },
        ];
        expect(calculateCompliance(trips, 'uae', '2026-03-01', uae).daysUsed).toBe(0);
    });

    it('treats back-to-back segments as one visit', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-01-01', exitDate: '2026-01-20' },
            { id: '2', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-01-21', exitDate: '2026-02-05' },
        ];
        const result = calculateCompliance(trips, 'uae', '2026-02-05', uae);
        expect(result.daysUsed).toBe(36);
        expect(result.isViolation).toBe(true);
    });

    it('finds the exit deadline beyond one year for a 365-day limit', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'georgia', countryCode: 'GE', entryDate: '2026-01-01', exitDate: null },
        ];
        // Day 365 of the visit is 2026-12-31
        expect(findExitDeadline(trips, 'georgia', '2026-01-01', georgia)).toBe('2026-12-31');
    });

    it('allows a full new visit right after leaving', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uae', countryCode: 'AE', entryDate: '2026-01-01', exitDate: '2026-01-30' },
        ];
        expect(simulateTrip(trips, 'uae', '2026-02-02', 30, uae).isViolation).toBe(false);
        expect(simulateTrip(trips, 'uae', '2026-02-02', 31, uae).isViolation).toBe(true);
    });
});

describe('combined rules (30 per visit AND 90 within 180, as in Kazakhstan)', () => {
    const KZ: StayRules = {
        kind: 'per_visit', windowSizeDays: 30, maxStayDays: 30,
        also: [{kind: 'rolling_window', windowSizeDays: 180, maxStayDays: 90}],
    };
    const kz = (id: string, entryDate: string, exitDate: string | null): Trip =>
        ({id, zoneId: 'kz', countryCode: 'KZ', entryDate, exitDate});
    // Three 25-day visits: 75 of 90 days in the window used, each visit within its own 30 days.
    const past = [kz('1', '2025-12-01', '2025-12-25'), kz('2', '2026-01-01', '2026-01-25'), kz('3', '2026-02-01', '2026-02-25')];

    it('counts the current visit but takes what is left from the stricter 90/180 rule', () => {
        const c = calculateCompliance([...past, kz('4', '2026-03-01', null)], 'kz', '2026-03-10', KZ);
        expect(c.daysUsed).toBe(10);
        // Visit: 20 left; window: 90 - 85 = 5 left.
        expect(c.daysRemaining).toBe(5);
        expect(c.isViolation).toBe(false);
        expect(c.limitedBy).toMatchObject({kind: 'rolling_window', maxStayDays: 90});
    });

    it('reports no limiting extra rule while the main rule is the stricter one', () => {
        const c = calculateCompliance([kz('1', '2026-03-01', null)], 'kz', '2026-03-10', KZ);
        expect(c.daysRemaining).toBe(20);
        expect(c.limitedBy).toBeNull();
    });

    it('flags a violation of the extra rule even when the visit is short', () => {
        const c = calculateCompliance([...past, kz('4', '2026-03-01', null)], 'kz', '2026-03-16', KZ);
        expect(c.daysUsed).toBe(16);
        expect(c.isViolation).toBe(true);
    });

    it('sets the exit deadline by whichever rule runs out first', () => {
        // Visit allows until 30 March; the window fills up on 15 March.
        expect(findExitDeadline([...past, kz('4', '2026-03-01', null)], 'kz', '2026-03-10', KZ)).toBe('2026-03-15');
        expect(findExitDeadline([kz('1', '2026-03-01', null)], 'kz', '2026-03-10', KZ)).toBe('2026-03-30');
    });

    it('simulates a trip against both rules', () => {
        const sim = simulateTrip(past, 'kz', '2026-03-01', 20, KZ);
        expect(sim.isViolation).toBe(true);
        expect(sim.maxOverageDays).toBe(5);
        expect(findMaxStayFromDate(past, 'kz', '2026-03-01', KZ)?.days).toBe(15);
    });
});
