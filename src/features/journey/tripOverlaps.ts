import dayjs from 'dayjs';

import type { Trip } from '../../types/Trip';

export interface TripOverlap {
  // The already saved trip the new one collides with.
  existing: Trip;
  days: number;
}

// Sharing one day is normal: a visa run leaves and re-enters the same country on one day, and every border
// crossing ends one stay and starts the next. Two shared days in one country can only be a duplicate or a typo.
const SAME_COUNTRY_MIN_DAYS = 2;
// Another country inside a stay is a side trip; with two shared days the count is still right (both are crossing
// days). From three days on, the stay claims full days spent elsewhere.
const OTHER_COUNTRY_MIN_DAYS = 3;

function lastDay(trip: Trip, today: string): string {
  return trip.exitDate ?? (trip.entryDate > today ? trip.entryDate : today);
}

function sharedDays(a: Trip, b: Trip, today: string): number {
  const start = a.entryDate > b.entryDate ? a.entryDate : b.entryDate;
  const endA = lastDay(a, today);
  const endB = lastDay(b, today);
  const end = endA < endB ? endA : endB;
  return end < start ? 0 : dayjs(end).diff(dayjs(start), 'day') + 1;
}

// Saved trips that the new ones contradict, each listed once, oldest first.
export function findTripOverlaps(newTrips: Trip[], existing: Trip[], today: string): TripOverlap[] {
  const result: TripOverlap[] = [];
  for (const old of existing) {
    let days = 0;
    for (const trip of newTrips) {
      const shared = sharedDays(trip, old, today);
      const min = trip.countryCode === old.countryCode ? SAME_COUNTRY_MIN_DAYS : OTHER_COUNTRY_MIN_DAYS;
      if (shared >= min) days = Math.max(days, shared);
    }
    if (days > 0) result.push({existing: old, days});
  }
  return result.sort((a, b) => a.existing.entryDate.localeCompare(b.existing.entryDate));
}
