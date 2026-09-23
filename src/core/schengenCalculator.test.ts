import { calculateCompliance, simulateTrip, findExitDeadline } from './schengenCalculator';
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