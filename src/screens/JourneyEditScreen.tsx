import React, { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';
import { EmptyState, Screen, ScreenHeader } from '../components/ui';
import { JourneyForm } from '../features/journey/JourneyForm';
import { journeyTrips } from '../features/journey/journeyUtils';
import { buildJourneyFields, draftFromJourney, emptyPoint } from '../features/journey/useJourneyDraft';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneyEdit'>;

export default function JourneyEditScreen({navigation, route}: Props) {
  const {journeyId, addSegment} = route.params;
  const {t, lang} = useT();
  const journey = useJourneysStore((s) => s.getJourney(journeyId));
  const updateJourney = useJourneysStore((s) => s.updateJourney);
  const allTrips = useTripsStore((s) => s.trips);
  const replaceTrips = useTripsStore((s) => s.replaceTrips);

  const trips = useMemo(() => (journey ? journeyTrips(journey, allTrips) : []), [journey, allTrips]);
  const tripIds = useMemo(() => trips.map((tr) => tr.id), [trips]);

  // The form calls the factory only on mount, so the draft isn't reset when the store updates.
  const initialDraft = () => {
    const draft = draftFromJourney(journey!, trips);
    return addSegment ? {...draft, points: [...draft.points, emptyPoint()]} : draft;
  };

  if (!journey) {
    return (
      <Screen>
        <ScreenHeader onBack={() => navigation.goBack()} backIcon="close"/>
        <EmptyState icon="map-outline" title={t('journey.notFound')} framed={false}/>
      </Screen>
    );
  }

  return (
    <JourneyForm
      mode="edit"
      initialDraft={initialDraft}
      excludeTripIds={tripIds}
      onCancel={() => navigation.goBack()}
      onSave={async (draft, newTrips) => {
        await replaceTrips(tripIds, newTrips);
        await updateJourney(journey.id, buildJourneyFields(draft, newTrips, lang, journey.name));
        navigation.goBack();
      }}
    />
  );
}
