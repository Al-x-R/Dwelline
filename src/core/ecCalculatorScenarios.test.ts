import { calculateCompliance, findExitDeadline, findMaxStayFromDate } from './schengenCalculator';
import type { Trip } from '../types/Trip';

// Worked examples from the European Commission's "User manual for the short-stay Schengen calculator", section 6:
// https://ec.europa.eu/assets/home/visa-calculator/docs/short_stay_schengen_calculator_user_manual_en.pdf
// Expected values are the manual's own answers; a mismatch means our engine disagrees with the official calculator.

function trip(id: string, entryDate: string, exitDate: string | null): Trip {
    return { id, zoneId: 'schengen', countryCode: 'FR', entryDate, exitDate };
}

describe('EC manual: person not subject to the visa requirement', () => {
    // 1.1.2024 in and out the same day, then 1.6.2024 – 20.9.2024.
    const trips = [trip('1', '2024-01-01', '2024-01-01'), trip('2', '2024-06-01', '2024-09-20')];

    it('on 14.6.2024: 15 days in 18.12.2023 – 14.6.2024, no overstay', () => {
        const result = calculateCompliance(trips, 'schengen', '2024-06-14');
        expect(result.windowStart).toBe('2023-12-18');
        expect(result.daysUsed).toBe(15);
        expect(result.isViolation).toBe(false);
    });

    it('on 29.8.2024: 90 days in 3.3 – 29.8.2024, still within the rule', () => {
        const result = calculateCompliance(trips, 'schengen', '2024-08-29');
        expect(result.windowStart).toBe('2024-03-03');
        expect(result.daysUsed).toBe(90);
        expect(result.isViolation).toBe(false);
    });

    it('29.8.2024 is the last day of authorised stay', () => {
        const stillThere = [trip('1', '2024-01-01', '2024-01-01'), trip('2', '2024-06-01', null)];
        expect(findExitDeadline(stillThere, 'schengen', '2024-06-14')).toBe('2024-08-29');
        expect(calculateCompliance(trips, 'schengen', '2024-08-30').isViolation).toBe(true);
    });

    it('leaving on 20.9.2024 is an overstay of 22 days', () => {
        const result = calculateCompliance(trips, 'schengen', '2024-09-20');
        expect(result.isViolation).toBe(true);
        expect(result.overageDays).toBe(22);
    });
});

describe('EC manual: person subject to the visa requirement (planning mode)', () => {
    // 1.1 – 10.1.2024 (10 days), 1.3 – 30.3.2024 (30 days), 1.5 – 9.6.2024 (40 days).
    const trips = [
        trip('1', '2024-01-01', '2024-01-10'),
        trip('2', '2024-03-01', '2024-03-30'),
        trip('3', '2024-05-01', '2024-06-09'),
    ];

    it('entering on 19.6.2024 allows 20 consecutive days', () => {
        expect(findMaxStayFromDate(trips, 'schengen', '2024-06-19')).toEqual({ date: '2024-07-08', days: 20 });
    });

    it('entering on 7.8.2024 still allows 20 days, leaving by 26.8.2024', () => {
        expect(findMaxStayFromDate(trips, 'schengen', '2024-08-07')).toEqual({ date: '2024-08-26', days: 20 });
    });

    it('entering on 8.8.2024 allows 50 consecutive days', () => {
        expect(findMaxStayFromDate(trips, 'schengen', '2024-08-08')).toEqual({ date: '2024-09-26', days: 50 });
    });

    it('entering on 8.9.2024, after 90 days away, allows the full 90 days', () => {
        expect(findMaxStayFromDate(trips, 'schengen', '2024-09-08')?.days).toBe(90);
    });
});
