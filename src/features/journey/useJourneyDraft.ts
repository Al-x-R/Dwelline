import { useCallback, useMemo, useState } from 'react';

import type { Journey } from '../../types/Journey';
import type { TransportMode, Trip } from '../../types/Trip';
import type { ZoneConfig } from '../../constants/zones';
import { countryCodeToFlag, countryName } from '../../constants/countries';
import { zoneIdForCountry } from '../../hooks/useZones';
import type { Language } from '../../i18n/types';
import { legDurationMinutes } from '../../utils/format';

export interface DraftPoint {
  id: string;
  countryCode: string | null;
  arrivalDate: string | null;
  arrivalTime?: string;
  departureTime?: string;
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
  points: DraftPoint[];
  turnaroundIndex: number | null;
  destinationCode: string | null;
  exitDate: string | null;
  destinationArrivalTime: string | null;
}

export type PointRole = 'transit' | 'main' | 'return';

export interface Leg {
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
    points: [emptyPoint()],
    turnaroundIndex: null,
    destinationCode: null,
    exitDate: null,
    destinationArrivalTime: null,
  };
}

export function draftFromJourney(journey: Journey, trips: Trip[]): JourneyDraft {
  const turnaround = journey.turnaroundTripId ? trips.findIndex((t) => t.id === journey.turnaroundTripId) : -1;
  return {
    name: journey.name,
    nameEdited: true,
    originCode: journey.originCountryCode ?? null,
    originDate: journey.originDepartureDate ?? null,
    originTime: journey.originDepartureTime,
    originTransport: (journey.originTransportMode as TransportMode | null) ?? undefined,
    points: trips.length
      ? trips.map((t) => ({
        id: t.id,
        countryCode: t.countryCode,
        arrivalDate: t.entryDate,
        arrivalTime: t.arrivalTime,
        departureTime: t.departureTime,
        transportMode: t.transportMode,
      }))
      : [emptyPoint()],
    turnaroundIndex: turnaround >= 0 ? turnaround : null,
    destinationCode: journey.destinationCountryCode ?? null,
    exitDate: trips[trips.length - 1]?.exitDate ?? null,
    destinationArrivalTime: journey.destinationArrivalTime,
  };
}

export function pointRole(draft: JourneyDraft, index: number): PointRole {
  const {turnaroundIndex, points} = draft;
  if (turnaroundIndex !== null) {
    if (index === turnaroundIndex) return 'main';
    return index > turnaroundIndex ? 'return' : 'transit';
  }
  return index === points.length - 1 ? 'main' : 'transit';
}

// Departure date from a point: arrival date at the next one, or the overall exit date for the last one.
export function pointExitDate(draft: JourneyDraft, index: number): string | null {
  const next = draft.points[index + 1];
  return next ? next.arrivalDate : draft.exitDate;
}

export function buildTrips(draft: JourneyDraft, zones: ZoneConfig[]): Trip[] {
  return draft.points.map((p, i) => ({
    id: p.id,
    zoneId: zoneIdForCountry(p.countryCode!, zones),
    countryCode: p.countryCode!,
    entryDate: p.arrivalDate!,
    exitDate: pointExitDate(draft, i),
    transportMode: p.transportMode,
    arrivalTime: p.arrivalTime || undefined,
    departureTime: p.departureTime || undefined,
  }));
}

export function buildJourneyFields(draft: JourneyDraft, trips: Trip[], lang: Language, fallbackName: string) {
  const origin = draft.originCode;
  const dest = draft.destinationCode;
  return {
    name: draft.name.trim() || fallbackName,
    originCountryCode: origin,
    originCountryName: origin ? countryName(origin, lang) : null,
    originCountryFlag: origin ? countryCodeToFlag(origin) : null,
    originDepartureDate: draft.originDate,
    originDepartureTime: draft.originTime,
    originTransportMode: draft.originTransport ?? null,
    destinationCountryCode: dest,
    destinationCountryName: dest ? countryName(dest, lang) : null,
    destinationCountryFlag: dest ? countryCodeToFlag(dest) : null,
    destinationArrivalTime: draft.destinationArrivalTime,
    turnaroundTripId: draft.turnaroundIndex !== null ? trips[draft.turnaroundIndex]?.id ?? null : null,
    tripIds: trips.map((t) => t.id),
  };
}

export function autoName(draft: JourneyDraft, lang: Language): string {
  const main = draft.points[draft.turnaroundIndex ?? draft.points.length - 1]?.countryCode;
  const from = draft.originCode ?? draft.points[0]?.countryCode;
  if (from && main && from !== main) return `${countryName(from, lang)} — ${countryName(main, lang)}`;
  return main ? countryName(main, lang) : '';
}

export function draftLegs(draft: JourneyDraft): { origin: Leg | null; points: (Leg | null)[] } {
  const {points, turnaroundIndex} = draft;
  const origin = draft.originCode
    ? {
      minutes: legDurationMinutes(draft.originDate, draft.originTime, points[0]?.arrivalDate ?? null, points[0]?.arrivalTime),
      isReturn: false,
    }
    : null;
  const legs = points.map((p, i) => {
    const isLast = i === points.length - 1;
    if (isLast && !draft.destinationCode) return null;
    const arrivalTime = isLast ? draft.destinationArrivalTime : points[i + 1].arrivalTime;
    return {
      minutes: legDurationMinutes(null, p.departureTime, null, arrivalTime),
      isReturn: turnaroundIndex !== null && i >= turnaroundIndex,
    };
  });
  return {origin, points: legs};
}

export function stopoverMinutes(draft: JourneyDraft, index: number): number | null {
  const p = draft.points[index];
  return legDurationMinutes(p.arrivalDate, p.arrivalTime, pointExitDate(draft, index), p.departureTime);
}

export function validateDraft(draft: JourneyDraft): 'ok' | 'incomplete' | 'order' {
  if (!draft.points.every((p) => p.countryCode && p.arrivalDate)) return 'incomplete';
  for (let i = 1; i < draft.points.length; i++) {
    if (draft.points[i].arrivalDate! < draft.points[i - 1].arrivalDate!) return 'order';
  }
  const last = draft.points[draft.points.length - 1];
  if (draft.exitDate && draft.exitDate < last.arrivalDate!) return 'order';
  return 'ok';
}

export function useJourneyDraft(initial: () => JourneyDraft, lang: Language) {
  const [draft, setDraft] = useState<JourneyDraft>(initial);

  const update = useCallback(
    (patch: Partial<JourneyDraft>) =>
      setDraft((d) => {
        const next = {...d, ...patch};
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  const updatePoint = useCallback(
    (index: number, patch: Partial<DraftPoint>) =>
      setDraft((d) => {
        const next = {...d, points: d.points.map((p, i) => (i === index ? {...p, ...patch} : p))};
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  const addPoint = useCallback(() => setDraft((d) => ({...d, points: [...d.points, emptyPoint()]})), []);

  const removePoint = useCallback(
    (index: number) =>
      setDraft((d) => {
        if (d.points.length === 1) return d;
        let turnaroundIndex = d.turnaroundIndex;
        if (turnaroundIndex !== null) {
          if (index < turnaroundIndex) turnaroundIndex -= 1;
          else if (index === turnaroundIndex) turnaroundIndex = null;
        }
        const next = {...d, points: d.points.filter((_, i) => i !== index), turnaroundIndex};
        return next.nameEdited ? next : {...next, name: autoName(next, lang)};
      }),
    [lang]
  );

  const setName = useCallback((name: string) => setDraft((d) => ({...d, name, nameEdited: name.length > 0})), []);

  const legs = useMemo(() => draftLegs(draft), [draft]);

  return {draft, setDraft, update, updatePoint, addPoint, removePoint, setName, legs};
}
