import { useMemo } from 'react';

import { useJourneysStore } from '../../store/journeysStore';
import { useTripsStore } from '../../store/tripsStore';
import type { Journey } from '../../types/Journey';
import type { Trip } from '../../types/Trip';
import { journeySpan, journeyTrips, type JourneySpan } from './journeyUtils';

export interface JourneyListItem {
  journey: Journey;
  trips: Trip[];
  span: JourneySpan | null;
}

// Journeys with their segments, newest first.
export function useJourneyList(): JourneyListItem[] {
  const journeys = useJourneysStore((s) => s.journeys);
  const trips = useTripsStore((s) => s.trips);
  return useMemo(
    () =>
      journeys
        .map((journey) => {
          const jt = journeyTrips(journey, trips);
          return {journey, trips: jt, span: journeySpan(jt)};
        })
        .sort((a, b) => (b.span?.start ?? b.journey.createdAt).localeCompare(a.span?.start ?? a.journey.createdAt)),
    [journeys, trips]
  );
}
