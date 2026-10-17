import { useMemo } from 'react';

import { countryCodeToFlag, countryName } from '../../constants/countries';
import { useFormatters } from '../../hooks/useFormatters';
import { useT } from '../../i18n';
import type { TransportMode } from '../../types/Trip';
import { mainIndex, pointDepartureDate, type JourneyDraft, type Leg } from './useJourneyDraft';

export type RouteNodeKind = 'origin' | 'point' | 'destination';

export interface RouteNode {
  key: string;
  code: string | null;
  flag: string;
  name: string;
  kind: RouteNodeKind;
  // Main point of the journey: the route turns back here.
  isMain: boolean;
  // Already formatted "12 Oct, 20:30".
  arrival?: string;
  departure?: string;
  // Short date of the key moment: departure for the origin, arrival otherwise.
  day?: string;
  // Leg to the next node.
  leg?: { transport?: TransportMode; minutes: number | null; isReturn: boolean };
}

// Route nodes: origin → points → final point, each with the leg to the next node.
export function useRouteNodes(draft: JourneyDraft, legs: Leg[]): RouteNode[] {
  const fmt = useFormatters();
  const {lang} = useT();

  return useMemo(() => {
    const at = (date: string | null | undefined, time: string | null | undefined) => {
      const parts = [date ? fmt.short(date) : null, time || null].filter(Boolean);
      return parts.length ? parts.join(', ') : undefined;
    };
    const legByKey = new Map(legs.map((l) => [l.key, l]));
    const legFor = (key: string): RouteNode['leg'] => {
      const leg = legByKey.get(key);
      return leg ? {transport: leg.transport, minutes: leg.minutes, isReturn: leg.isReturn} : undefined;
    };
    const place = (code: string | null) => ({
      code,
      flag: code ? countryCodeToFlag(code) : '🏳️',
      name: code ? countryName(code, lang) : '···',
    });

    const nodes: RouteNode[] = [];
    if (draft.originCode) {
      nodes.push({
        key: 'origin',
        ...place(draft.originCode),
        kind: 'origin',
        isMain: false,
        departure: at(draft.originDate, draft.originTime),
        day: draft.originDate ? fmt.dayMonth(draft.originDate) : undefined,
        leg: legFor('origin'),
      });
    }
    const main = mainIndex(draft);
    draft.points.forEach((p, i) => {
      if (draft.hasFinal && i === draft.points.length - 1) {
        nodes.push({
          key: p.id,
          ...place(p.countryCode),
          kind: 'destination',
          isMain: false,
          arrival: at(p.arrivalDate, p.arrivalTime),
          day: p.arrivalDate ? fmt.dayMonth(p.arrivalDate) : undefined,
        });
        return;
      }
      const exit = pointDepartureDate(draft, i);
      nodes.push({
        key: p.id,
        ...place(p.countryCode),
        kind: 'point',
        isMain: i === main,
        arrival: at(p.arrivalDate, p.arrivalTime),
        departure: at(exit, p.departureTime),
        day: p.arrivalDate ? fmt.dayMonth(p.arrivalDate) : undefined,
        leg: legFor(p.id),
      });
    });
    return nodes;
  }, [draft, legs, fmt, lang]);
}
