import React from 'react';

import { useT } from '../i18n';
import { useRootNavigation } from '../navigation/types';
import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';
import { JourneyForm } from '../features/journey/JourneyForm';
import { buildJourneyFields, emptyDraft } from '../features/journey/useJourneyDraft';

const CLOSE_DELAY_MS = 600;

export default function AddTripScreen() {
  const navigation = useRootNavigation();
  const {t, lang} = useT();
  const addTrips = useTripsStore((s) => s.addTrips);
  const addJourney = useJourneysStore((s) => s.addJourney);

  return (
    <JourneyForm
      mode="new"
      initialDraft={emptyDraft}
      onCancel={() => navigation.goBack()}
      onSave={async (draft, trips) => {
        await addTrips(trips);
        const journey = await addJourney(buildJourneyFields(draft, trips, lang, t('form.defaultName')));
        setTimeout(() => navigation.replace('JourneyDetail', {journeyId: journey.id}), CLOSE_DELAY_MS);
      }}
    />
  );
}
