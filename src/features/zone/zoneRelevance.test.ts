import type { Trip } from '../../types/Trip';
import { sortZonesByRelevance } from './zoneRelevance';

const zones = ['schengen', 'md', 'cy', 'ge', 'tr'].map((id) => ({id}));
const trip = (zoneId: string, entryDate: string, exitDate: string | null): Trip =>
  ({id: `${zoneId}${entryDate}`, zoneId, countryCode: 'XX', entryDate, exitDate});

describe('sortZonesByRelevance', () => {
  const today = '2026-10-16';

  it('puts the current zone first, then upcoming (nearest first), then past (latest first)', () => {
    const trips = [
      trip('md', '2026-01-10', '2026-01-12'),
      trip('ge', '2026-08-01', '2026-08-20'),
      trip('tr', '2026-12-01', '2026-12-10'),
      trip('schengen', '2026-11-01', '2026-11-05'),
      trip('cy', '2026-08-01', null),
    ];
    expect(sortZonesByRelevance(zones, trips, today).map((z) => z.id)).toEqual(['cy', 'schengen', 'tr', 'ge', 'md']);
  });

  it('keeps the original order when there are no trips', () => {
    expect(sortZonesByRelevance(zones, [], today)).toEqual(zones);
  });

  it('uses the most relevant trip of a zone', () => {
    const trips = [trip('md', '2025-05-01', '2025-05-03'), trip('md', '2026-10-15', '2026-10-20')];
    expect(sortZonesByRelevance(zones, trips, today)[0].id).toBe('md');
  });
});
