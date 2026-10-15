import { Share } from 'react-native';

import { countryName } from '../constants/countries';
import { tripDaysCount } from '../core/zoneAnalytics';
import type { Language } from '../i18n/types';
import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildTripsCsv(lang: Language): string {
  const trips = useTripsStore.getState().trips;
  const journeys = useJourneysStore.getState().journeys;
  const journeyByTrip = new Map<string, string>();
  for (const j of journeys) for (const id of j.tripIds) journeyByTrip.set(id, j.name);

  const header = ['journey', 'country_code', 'country', 'zone', 'entry_date', 'exit_date', 'days', 'transport'];
  const rows = [...trips]
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate))
    .map((t) => [
      journeyByTrip.get(t.id) ?? '',
      t.countryCode,
      countryName(t.countryCode, lang),
      t.zoneId,
      t.entryDate,
      t.exitDate ?? '',
      tripDaysCount(t),
      t.transportMode ?? '',
    ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export async function shareTripsCsv(lang: Language, title: string) {
  await Share.share({title, message: buildTripsCsv(lang)});
}
