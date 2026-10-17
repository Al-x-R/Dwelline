import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { navigationRef } from '../navigation/types';
import { planNotifications } from '../services/notifications/planNotifications';
import { configureNotifications, ensurePermission, readData, replaceScheduled } from '../services/notifications/scheduler';
import { translate } from '../i18n';
import { useJourneysStore } from '../store/journeysStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTripsStore } from '../store/tripsStore';
import { useTravelDocuments } from './useZoneContext';
import { useZones } from './useZones';

const RESCHEDULE_DELAY_MS = 800;

function openFromNotification(response: Notifications.NotificationResponse) {
  const data = readData(response);
  if (!data || !navigationRef.isReady()) return;
  const journeyExists = data.journeyId && useJourneysStore.getState().getJourney(data.journeyId);
  if (journeyExists) navigationRef.navigate('JourneyDetail', {journeyId: data.journeyId!});
  else navigationRef.navigate('MainTabs', {screen: 'Home'});
}

// Keeps scheduled reminders in sync with trips, documents and settings, and opens the right screen on tap.
export function useNotifications() {
  const trips = useTripsStore((s) => s.trips);
  const journeys = useJourneysStore((s) => s.journeys);
  const {allZones} = useZones();
  const docs = useTravelDocuments();
  const lang = useSettingsStore((s) => s.language);
  const bufferDays = useSettingsStore((s) => s.safetyBufferDays);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const limit = useSettingsStore((s) => s.overstayAlerts);
  const exit = useSettingsStore((s) => s.exitReminders);
  const document = useSettingsStore((s) => s.documentAlerts);

  // Runs one at a time: cancel-all and schedule must not interleave between two runs.
  const queue = useRef<Promise<void>>(Promise.resolve());

  const reschedule = useCallback(() => {
    queue.current = queue.current
      .then(async () => {
        await configureNotifications(translate(lang, 'notify.channel'));
        const plan = planNotifications({
          trips, journeys, zones: allZones, docs, bufferDays, prefs: {limit, exit, document}, lang, now: new Date(),
        });
        // Ask only once there is something worth notifying about, and never over the onboarding.
        if (plan.length > 0 && !(onboardingDone && await ensurePermission())) return;
        await replaceScheduled(plan);
      })
      .catch((e) => console.error('Failed to schedule notifications', e));
  }, [trips, journeys, allZones, docs, bufferDays, limit, exit, document, lang, onboardingDone]);

  useEffect(() => {
    const timer = setTimeout(reschedule, RESCHEDULE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reschedule]);

  // Days pass while the app sleeps: refresh on return so far-off reminders move into the scheduled window.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reschedule();
    });
    return () => sub.remove();
  }, [reschedule]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => sub.remove();
  }, []);

  // Cold start from a tap: the response arrived before the listener existed.
  const onNavigationReady = useCallback(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        openFromNotification(response);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch((e) => console.error('Failed to read the last notification', e));
  }, []);

  return {onNavigationReady};
}
