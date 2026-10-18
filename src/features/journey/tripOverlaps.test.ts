import type { Trip } from '../../types/Trip';
import { findTripOverlaps } from './tripOverlaps';

const today = '2026-10-18';
const trip = (id: string, countryCode: string, entryDate: string, exitDate: string | null): Trip => ({
  id, zoneId: countryCode === 'MD' ? 'moldova' : 'schengen', countryCode, entryDate, exitDate,
});

describe('findTripOverlaps', () => {
  it('flags an exact duplicate', () => {
    const saved = trip('old', 'MD', '2026-07-31', '2026-08-01');
    const result = findTripOverlaps([trip('new', 'MD', '2026-07-31', '2026-08-01')], [saved], today);
    expect(result).toEqual([{existing: saved, days: 2}]);
  });

  it('allows a visa run: leaving and re-entering the same country on one day', () => {
    const result = findTripOverlaps([trip('new', 'MD', '2026-08-10', '2026-08-20')], [trip('old', 'MD', '2026-08-01', '2026-08-10')], today);
    expect(result).toEqual([]);
  });

  it('allows a border crossing day shared with another country', () => {
    const result = findTripOverlaps([trip('new', 'PL', '2026-08-10', '2026-08-20')], [trip('old', 'MD', '2026-08-01', '2026-08-10')], today);
    expect(result).toEqual([]);
  });

  it('allows a short side trip inside a long stay', () => {
    const result = findTripOverlaps([trip('new', 'PL', '2026-08-04', '2026-08-05')], [trip('old', 'MD', '2026-08-01', '2026-08-10')], today);
    expect(result).toEqual([]);
  });

  it('flags another country taking up full days of a stay', () => {
    const result = findTripOverlaps([trip('new', 'PL', '2026-08-04', '2026-08-07')], [trip('old', 'MD', '2026-08-01', '2026-08-10')], today);
    expect(result.map((o) => o.days)).toEqual([4]);
  });

  it('treats an ongoing stay as lasting until today', () => {
    const result = findTripOverlaps([trip('new', 'MD', '2026-10-15', '2026-10-17')], [trip('old', 'MD', '2026-10-01', null)], today);
    expect(result.map((o) => o.days)).toEqual([3]);
  });

  it('lists each saved trip once, oldest first', () => {
    const a = trip('a', 'MD', '2026-09-01', '2026-09-10');
    const b = trip('b', 'MD', '2026-07-01', '2026-07-10');
    const result = findTripOverlaps(
      [trip('n1', 'MD', '2026-07-01', '2026-07-10'), trip('n2', 'MD', '2026-09-01', '2026-09-10'), trip('n3', 'MD', '2026-09-05', '2026-09-08')],
      [a, b],
      today
    );
    expect(result.map((o) => o.existing.id)).toEqual(['b', 'a']);
  });
});
