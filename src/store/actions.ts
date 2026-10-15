import { useJourneysStore } from './journeysStore';
import { useTripsStore } from './tripsStore';

export async function deleteJourneyWithTrips(journeyId: string) {
  const journey = useJourneysStore.getState().getJourney(journeyId);
  if (!journey) return;
  await useTripsStore.getState().replaceTrips(journey.tripIds, []);
  await useJourneysStore.getState().deleteJourney(journeyId);
}

export async function resetAllData() {
  await useTripsStore.getState().clearTrips();
  await useJourneysStore.getState().clearJourneys();
}
