import dayjs from 'dayjs';

import type { Journey } from '../../types/Journey';
import type { TransportMode, Trip } from '../../types/Trip';
import type { IconName } from '../../components/ui';
import { countryCodeToFlag, countryName } from '../../constants/countries';
import type { Language } from '../../i18n/types';
import { todayIso, tripDaysCount } from '../../core/zoneAnalytics';

export const TRANSPORT_MODES: TransportMode[] = ['plane', 'car', 'bus', 'train', 'ferry', 'walk'];

export const TRANSPORT_ICONS: Record<TransportMode, IconName> = {
  plane: 'airplane-outline',
  car: 'car-outline',
  bus: 'bus-outline',
  train: 'train-outline',
  ferry: 'boat-outline',
  walk: 'walk-outline',
  other: 'navigate-outline',
};

export type JourneyState = 'active' | 'planned' | 'completed';

export interface JourneySpan {
  start: string;
  end: string;
  days: number;
  isOpen: boolean;
}

export function journeyTrips(journey: Journey, trips: Trip[]): Trip[] {
  const ids = new Set(journey.tripIds);
  return trips.filter((t) => ids.has(t.id)).sort((a, b) => a.entryDate.localeCompare(b.entryDate));
}

export function journeySpan(trips: Trip[], today: string = todayIso()): JourneySpan | null {
  if (trips.length === 0) return null;
  const start = trips[0].entryDate;
  const last = trips[trips.length - 1];
  const isOpen = last.exitDate === null;
  const end = last.exitDate ?? (last.entryDate > today ? last.entryDate : today);
  return {start, end, isOpen, days: Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1)};
}

export function journeyState(span: JourneySpan | null, today: string = todayIso()): JourneyState {
  if (!span) return 'completed';
  if (span.start > today) return 'planned';
  if (span.isOpen || span.end >= today) return 'active';
  return 'completed';
}

export function daysByZone(trips: Trip[]): Map<string, number> {
  const byZone = new Map<string, number>();
  for (const t of trips) byZone.set(t.zoneId, (byZone.get(t.zoneId) ?? 0) + tripDaysCount(t));
  return byZone;
}

export function journeyOrigin(journey: Journey, lang: Language): { name: string; flag: string } | null {
  if (journey.originCountryCode) {
    return {name: countryName(journey.originCountryCode, lang), flag: countryCodeToFlag(journey.originCountryCode)};
  }
  if (journey.originCountryName) return {name: journey.originCountryName, flag: journey.originCountryFlag ?? '🏳️'};
  return null;
}

export function journeyDestination(journey: Journey, lang: Language): { name: string; flag: string } | null {
  if (journey.destinationCountryCode) {
    return {
      name: countryName(journey.destinationCountryCode, lang),
      flag: countryCodeToFlag(journey.destinationCountryCode),
    };
  }
  if (journey.destinationCountryName) {
    return {name: journey.destinationCountryName, flag: journey.destinationCountryFlag ?? '🏳️'};
  }
  return null;
}

// Short human-readable identifier for the journey details header.
export function journeyShortId(journey: Journey): string {
  const digits = journey.id.replace(/\D/g, '');
  return `TRP-${digits.slice(-4).padStart(4, '0')}`;
}

export function uniqueFlags(trips: Trip[]): string[] {
  return Array.from(new Set(trips.map((t) => countryCodeToFlag(t.countryCode))));
}
