import type { Trip } from '../../types/Trip';

// Zones ordered by how relevant they are right now:
// 1) where the user is today, 2) upcoming trips, nearest first, 3) past trips, most recent first, 4) the rest.
// Ties and zones without trips keep their original order.
export function sortZonesByRelevance<Z extends { id: string }>(zones: Z[], trips: Trip[], today: string): Z[] {
  const rank = new Map<string, [number, number]>();
  for (const trip of trips) {
    const end = trip.exitDate ?? '9999-12-31';
    const key: [number, number] =
      trip.entryDate <= today && end >= today ? [0, 0]
        : trip.entryDate > today ? [1, Date.parse(trip.entryDate)]
          : [2, -Date.parse(end)];
    const prev = rank.get(trip.zoneId);
    if (!prev || key[0] < prev[0] || (key[0] === prev[0] && key[1] < prev[1])) rank.set(trip.zoneId, key);
  }
  return zones
    .map((zone, index) => ({zone, index, key: rank.get(zone.id) ?? [3, 0]}))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.index - b.index)
    .map(({zone}) => zone);
}
