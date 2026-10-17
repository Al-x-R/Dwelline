import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import type { Journey } from '../../types/Journey';
import type { TransportMode, Trip } from '../../types/Trip';
import type { ZoneConfig } from '../../constants/zones';
import { countryCodeToFlag, countryName, flagToCountryCode } from '../../constants/countries';
import { zoneIdForCountry } from '../../hooks/useZones';
import type { Language } from '../../i18n/types';
import { legDurationMinutes } from '../../utils/format';

export interface DraftPoint {
  id: string;
  countryCode: string | null;
  arrivalDate: string | null;
  arrivalTime?: string;
  // Departure from this point; unset falls back to the arrival date at the next one.
  departureDate?: string | null;
  departureTime?: string;
  // Border crossing on the way out when it isn't the departure date (e.g. days stuck at customs).
  borderDate?: string | null;
  // Transport used to leave this point.
  transportMode?: TransportMode;
}

export interface JourneyDraft {
  name: string;
  nameEdited: boolean;
  originCode: string | null;
  originDate: string | null;
  originTime: string | null;
  originTransport?: TransportMode;
  originBorderDate: string | null;
  points: DraftPoint[];
  turnaroundIndex: number | null;
  // The last point is where the journey ends (stored as the journey destination, not a stay).
  hasFinal: boolean;
}

export type PointRole = 'transit' | 'main' | 'return' | 'final';

export interface Leg {
  key: string;
  fromCode: string | null;
  toCode: string | null;
  transport?: TransportMode;
  minutes: number | null;
  isReturn: boolean;
}

export function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyPoint(): DraftPoint {
  return {id: makeId(), countryCode: null, arrivalDate: null};
}

export function emptyDraft(): JourneyDraft {
  return {
    name: '',
    nameEdited: false,
    originCode: null,
    originDate: null,
    originTime: null,
    originBorderDate: null,
    points: [emptyPoint()],
    turnaroundIndex: null,
    hasFinal: false,
  };
}

// Points that are actual stays: everything except the final point.
export function stayPoints(draft: JourneyDraft): DraftPoint[] {
  return draft.hasFinal ? draft.points.slice(0, -1) : draft.points;
}

export function mainIndex(draft: JourneyDraft): number {
  return draft.turnaroundIndex ?? stayPoints(draft).length - 1;
}

export function draftFromJourney(journey: Journey, trips: Trip[]): JourneyDraft {
  const turnaround = journey.turnaroundTripId ? trips.findIndex((t) => t.id === journey.turnaroundTripId) : -1;
  const destCode = journey.destinationCountryCode ?? flagToCountryCode(journey.destinationCountryFlag);
  const lastExit = trips[trips.length - 1]?.exitDate ?? null;
  const hasFinal = trips.length > 0 && !!destCode;
  const points: DraftPoint[] = trips.length
    ? trips.map((t) => ({
      id: t.id,
      countryCode: t.countryCode,
      arrivalDate: t.arrivalDate ?? t.entryDate,
      arrivalTime: t.arrivalTime,
      departureDate: t.departureDate ?? t.exitDate,
      departureTime: t.departureTime,
      borderDate: t.departureDate && t.exitDate !== t.departureDate ? t.exitDate : null,
      transportMode: t.transportMode,
    }))
    : [emptyPoint()];
  if (hasFinal) {
    points.push({
      id: makeId(),
      countryCode: destCode,
      arrivalDate: journey.destinationArrivalDate ?? lastExit,
      arrivalTime: journey.destinationArrivalTime ?? undefined,
    });
  }
  return {
    name: journey.name,
    nameEdited: true,
    // Older journeys stored only the name and flag.
    originCode: journey.originCountryCode ?? flagToCountryCode(journey.originCountryFlag),
    originDate: journey.originDepartureDate ?? null,
    originTime: journey.originDepartureTime ?? null,
    originTransport: (journey.originTransportMode as TransportMode | null) ?? undefined,
    originBorderDate: journey.originBorderDate ?? null,
    points,
    turnaroundIndex: turnaround >= 0 ? turnaround : null,
    hasFinal,
  };
}

export function pointRole(draft: JourneyDraft, index: number): PointRole {
  if (draft.hasFinal && index === draft.points.length - 1) return 'final';
  const main = mainIndex(draft);
  if (index === main) return 'main';
  return index > main ? 'return' : 'transit';
}

// Departure date from a point: its own date, or the arrival date at the next one. The final point has none.
export function pointDepartureDate(draft: JourneyDraft, index: number): string | null {
  if (pointRole(draft, index) === 'final') return null;
  const p = draft.points[index];
  return p.departureDate ?? draft.points[index + 1]?.arrivalDate ?? null;
}

// A flight crosses the border on departure; otherwise the user may set a later crossing date.
function crossingDate(departure: string | null, border: string | null | undefined, transport?: TransportMode) {
  return transport === 'plane' ? departure : border ?? departure;
}

// Day the point's country is left — what the limit counts.
export function pointBorderDate(draft: JourneyDraft, index: number): string | null {
  const p = draft.points[index];
  return crossingDate(pointDepartureDate(draft, index), p.borderDate, p.transportMode);
}

// Day the point's country is entered. By flight it's the arrival; over land it's the crossing on the incoming leg.
export function pointEntryDate(draft: JourneyDraft, index: number): string | null {
  const p = draft.points[index];
  const incoming = index === 0
    ? draft.originCode
      ? {transport: draft.originTransport, crossing: crossingDate(draft.originDate, draft.originBorderDate, draft.originTransport)}
      : null
    : {transport: draft.points[index - 1].transportMode, crossing: pointBorderDate(draft, index - 1)};
  if (!incoming || incoming.transport === 'plane' || !incoming.crossing || !p.arrivalDate) return p.arrivalDate;
  return incoming.crossing < p.arrivalDate ? incoming.crossing : p.arrivalDate;
}

export function buildTrips(draft: JourneyDraft, zones: ZoneConfig[]): Trip[] {
  return stayPoints(draft).map((p, i) => {
    const entryDate = pointEntryDate(draft, i)!;
    const exitDate = pointBorderDate(draft, i);
    const departureDate = pointDepartureDate(draft, i);
    return {
      id: p.id,
      zoneId: zoneIdForCountry(p.countryCode!, zones),
      countryCode: p.countryCode!,
      entryDate,
      exitDate,
      // Travel dates are kept only where they differ from the counted ones.
      arrivalDate: p.arrivalDate !== entryDate ? p.arrivalDate! : undefined,
      departureDate: departureDate && departureDate !== exitDate ? departureDate : undefined,
      transportMode: p.transportMode,
      arrivalTime: p.arrivalTime || undefined,
      departureTime: p.departureTime || undefined,
    };
  });
}

export function buildJourneyFields(draft: JourneyDraft, trips: Trip[], lang: Language, fallbackName: string) {
  const origin = draft.originCode;
  const final = draft.hasFinal ? draft.points[draft.points.length - 1] : null;
  const dest = final?.countryCode ?? null;
  return {
    name: draft.name.trim() || fallbackName,
    originCountryCode: origin,
    originCountryName: origin ? countryName(origin, lang) : null,
    originCountryFlag: origin ? countryCodeToFlag(origin) : null,
    originDepartureDate: draft.originDate,
    originDepartureTime: draft.originTime,
    originTransportMode: draft.originTransport ?? null,
    originBorderDate: draft.originTransport === 'plane' ? null : draft.originBorderDate,
    destinationCountryCode: dest,
    destinationCountryName: dest ? countryName(dest, lang) : null,
    destinationCountryFlag: dest ? countryCodeToFlag(dest) : null,
    destinationArrivalDate: final?.arrivalDate ?? null,
    destinationArrivalTime: final?.arrivalTime ?? null,
    turnaroundTripId: draft.turnaroundIndex !== null ? trips[draft.turnaroundIndex]?.id ?? null : null,
    tripIds: trips.map((t) => t.id),
  };
}

export function autoName(draft: JourneyDraft, lang: Language): string {
  const main = draft.points[mainIndex(draft)]?.countryCode;
  const from = draft.originCode ?? draft.points[0]?.countryCode;
  if (from && main && from !== main) return `${countryName(from, lang)} — ${countryName(main, lang)}`;
  return main ? countryName(main, lang) : '';
}

// Legs between consecutive route nodes: origin → point 1 → … → final point.
// Legs after the main point (turnaround, or the last stay) count as the return trip.
export function draftLegs(draft: JourneyDraft): Leg[] {
  const {points} = draft;
  const main = mainIndex(draft);
  const legs: Leg[] = [];
  if (draft.originCode && points[0]) {
    legs.push({
      key: 'origin',
      fromCode: draft.originCode,
      toCode: points[0].countryCode,
      transport: draft.originTransport,
      minutes: legDurationMinutes(draft.originDate, draft.originTime, points[0].arrivalDate, points[0].arrivalTime),
      isReturn: false,
    });
  }
  points.forEach((p, i) => {
    const next = points[i + 1];
    if (!next) return;
    legs.push({
      key: p.id,
      fromCode: p.countryCode,
      toCode: next.countryCode,
      transport: p.transportMode,
      minutes: legDurationMinutes(pointDepartureDate(draft, i), p.departureTime, next.arrivalDate, next.arrivalTime),
      isReturn: i >= main,
    });
  });
  return legs;
}

export interface TravelSummary {
  outbound: number;
  inbound: number;
  total: number;
  hasReturn: boolean;
  allKnown: boolean;
}

export function travelSummary(legs: Leg[]): TravelSummary | null {
  const known = legs.filter((l): l is Leg & { minutes: number } => l.minutes !== null);
  if (known.length === 0) return null;
  const sum = (items: { minutes: number }[]) => items.reduce((acc, l) => acc + l.minutes, 0);
  return {
    outbound: sum(known.filter((l) => !l.isReturn)),
    inbound: sum(known.filter((l) => l.isReturn)),
    total: sum(known),
    hasReturn: legs.some((l) => l.isReturn),
    allKnown: known.length === legs.length,
  };
}

export function stopoverMinutes(draft: JourneyDraft, index: number): number | null {
  const p = draft.points[index];
  return legDurationMinutes(p.arrivalDate, p.arrivalTime, pointDepartureDate(draft, index), p.departureTime);
}

// Every date along the route, in travel order: departure → border → arrival → departure → …
function routeDates(draft: JourneyDraft): (string | null)[] {
  const dates: (string | null)[] = [draft.originDate, draft.originCode ? crossingDate(draft.originDate, draft.originBorderDate, draft.originTransport) : null];
  draft.points.forEach((p, i) => {
    dates.push(p.arrivalDate, pointDepartureDate(draft, i), pointBorderDate(draft, i));
  });
  return dates;
}

export function validateDraft(draft: JourneyDraft): 'ok' | 'incomplete' | 'order' {
  if (!draft.points.every((p) => p.countryCode && p.arrivalDate)) return 'incomplete';
  const dates = routeDates(draft).filter((d): d is string => !!d);
  return dates.every((d, i) => i === 0 || d >= dates[i - 1]) ? 'ok' : 'order';
}

const nextDay = (date: string) => dayjs(date).add(1, 'day').format('YYYY-MM-DD');

// Arriving earlier in the day than you left means arriving the next day: 20 Sep 16:10 → 07:30 is 21 Sep.
// The departure date is pinned first, since by default it follows the next arrival.
export function fixOvernightLegs(draft: JourneyDraft): JourneyDraft {
  const points = [...draft.points];
  const first = points[0];
  if (first && draft.originDate && draft.originTime && first.arrivalTime
    && first.arrivalDate === draft.originDate && first.arrivalTime < draft.originTime) {
    points[0] = {...first, arrivalDate: nextDay(first.arrivalDate)};
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    const departure = pointDepartureDate({...draft, points}, i);
    if (departure && p.departureTime && next.arrivalTime && next.arrivalDate === departure && next.arrivalTime < p.departureTime) {
      points[i] = {...p, departureDate: departure};
      points[i + 1] = {...next, arrivalDate: nextDay(departure)};
    }
  }
  return points.every((p, i) => p === draft.points[i]) ? draft : {...draft, points};
}

export function useJourneyDraft(initial: () => JourneyDraft, lang: Language) {
  const [draft, setDraft] = useState<JourneyDraft>(initial);

  const update = useCallback(
    (patch: Partial<JourneyDraft>) =>
      setDraft((d) => {
        const next = fixOvernightLegs({...d, ...patch});
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  const updatePoint = useCallback(
    (index: number, patch: Partial<DraftPoint>) =>
      setDraft((d) => {
        const next = fixOvernightLegs({...d, points: d.points.map((p, i) => (i === index ? {...p, ...patch} : p))});
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  // The old last point's planned exit is the natural arrival date at the new one.
  const addPoint = useCallback(
    () => setDraft((d) => ({...d, points: [...d.points, {...emptyPoint(), arrivalDate: d.points[d.points.length - 1]?.departureDate ?? null}]})),
    []
  );

  const removePoint = useCallback(
    (index: number) =>
      setDraft((d) => {
        if (d.points.length === 1) return d;
        const isLast = index === d.points.length - 1;
        // Removing the last point keeps the new last point's departure date (the removed point's arrival).
        const points = d.points
          .filter((_, i) => i !== index)
          .map((p, i, arr) =>
            isLast && i === arr.length - 1 ? {...p, departureDate: p.departureDate ?? d.points[index].arrivalDate} : p
          );
        let turnaroundIndex = d.turnaroundIndex;
        if (turnaroundIndex !== null) {
          if (index < turnaroundIndex) turnaroundIndex -= 1;
          else if (index === turnaroundIndex) turnaroundIndex = null;
          // The last point can't be a turnaround — nothing follows it.
          if (turnaroundIndex !== null && turnaroundIndex >= points.length - 1) turnaroundIndex = null;
        }
        // A final point only exists on a route with a turnaround.
        const hasFinal = d.hasFinal && !isLast && turnaroundIndex !== null;
        const next = {...d, points, turnaroundIndex, hasFinal};
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  const setName = useCallback((name: string) => setDraft((d) => ({...d, name, nameEdited: name.length > 0})), []);

  const legs = useMemo(() => draftLegs(draft), [draft]);

  return {draft, setDraft, update, updatePoint, addPoint, removePoint, setName, legs};
}
