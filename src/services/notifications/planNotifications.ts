import dayjs from 'dayjs';

import { NO_ZONE, type ZoneConfig } from '../../constants/zones';
import { countryName } from '../../constants/countries';
import { findExitDeadline } from '../../core/schengenCalculator';
import { zoneContext, type TravelDocuments } from '../../core/zoneAccess';
import { translate, type Language, type TranslationKey } from '../../i18n';
import type { Journey } from '../../types/Journey';
import type { Trip } from '../../types/Trip';
import { formatDate } from '../../utils/format';

export type NotificationKind = 'limit' | 'exit' | 'document';

export interface PlannedNotification {
  kind: NotificationKind;
  date: Date;
  title: string;
  body: string;
  // Journey to open on tap; none opens the home screen.
  journeyId?: string;
}

export interface NotificationPrefs {
  limit: boolean;
  exit: boolean;
  document: boolean;
}

export interface PlanInput {
  trips: Trip[];
  journeys: Journey[];
  zones: ZoneConfig[];
  docs: TravelDocuments;
  bufferDays: number;
  prefs: NotificationPrefs;
  lang: Language;
  now: Date;
}

// Reminders go out in the morning, local time.
export const NOTIFY_HOUR = 10;
// iOS keeps at most 64 pending local notifications; the nearest ones win, the rest are scheduled on a later run.
export const MAX_SCHEDULED = 60;
// Below this many days a stay is a transit; reminding about its exit is noise.
const MIN_STAY_FOR_EXIT_REMINDER = 3;
const DOCUMENT_LEAD_DAYS = [30, 7, 1];
const LIMIT_LEAD_DAYS = [7, 3, 1];

const ISO = 'YYYY-MM-DD';

export function planNotifications(input: PlanInput): PlannedNotification[] {
  const {prefs, now} = input;
  const plan = [
    ...(prefs.limit ? limitAlerts(input) : []),
    ...(prefs.exit ? exitReminders(input) : []),
    ...(prefs.document ? documentAlerts(input) : []),
  ];
  return plan
    .filter((n) => n.date.getTime() > now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);
}

function at(date: string): Date {
  return dayjs(date).hour(NOTIFY_HOUR).minute(0).second(0).millisecond(0).toDate();
}

function shift(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format(ISO);
}

function zoneName(zone: ZoneConfig, lang: Language): string {
  return zone.isCustom ? zone.name : translate(lang, `zone.${zone.id}` as TranslationKey);
}

function journeyOf(tripId: string, journeys: Journey[]): string | undefined {
  return journeys.find((j) => j.tripIds.includes(tripId))?.id;
}

// 1. Limit: the user is in a zone now and staying on would break the rule before (or without) a planned exit.
function limitAlerts({trips, journeys, zones, docs, bufferDays, lang, now}: PlanInput): PlannedNotification[] {
  const today = dayjs(now).format(ISO);
  const result: PlannedNotification[] = [];
  const zoneIds = new Set(trips.map((t) => t.zoneId).filter((id) => id !== NO_ZONE));
  for (const zone of zones.filter((z) => zoneIds.has(z.id))) {
    const ctx = zoneContext(zone, trips, docs, today);
    if (ctx.access.mode === 'free') continue;
    const current = ctx.trips.find(
      (t) => t.zoneId === zone.id && t.entryDate <= today && (t.exitDate === null || t.exitDate >= today)
    );
    if (!current) continue;
    // Latest safe exit if the user simply stays.
    const staying = ctx.trips.map((t) => (t === current ? {...t, exitDate: null} : t));
    const deadline = findExitDeadline(staying, zone.id, today, ctx.rules);
    if (!deadline) continue;
    if (current.exitDate && current.exitDate <= deadline) continue;

    const name = zoneName(zone, lang);
    const date = formatDate(deadline, 'D MMMM', lang);
    const journeyId = journeyOf(current.id, journeys);
    const leads = Array.from(new Set([bufferDays, ...LIMIT_LEAD_DAYS])).filter((n) => n > 0);
    for (const days of leads) {
      result.push({
        kind: 'limit',
        date: at(shift(deadline, -days)),
        title: translate(lang, 'notify.limitSoonTitle', {zone: name, count: days}),
        body: translate(lang, 'notify.limitSoonBody', {date}),
        journeyId,
      });
    }
    result.push({
      kind: 'limit',
      date: at(deadline),
      title: translate(lang, 'notify.limitLastDayTitle', {zone: name}),
      body: translate(lang, 'notify.limitLastDayBody'),
      journeyId,
    });
    result.push({
      kind: 'limit',
      date: at(shift(deadline, 1)),
      title: translate(lang, 'notify.overstayTitle', {zone: name}),
      body: translate(lang, 'notify.overstayBody'),
      journeyId,
    });
  }
  return result;
}

// 2. Exit: keep the data honest — a planned exit that didn't happen silently breaks every count.
function exitReminders({trips, journeys, lang, now}: PlanInput): PlannedNotification[] {
  const today = dayjs(now).format(ISO);
  return trips
    .filter((t): t is Trip & { exitDate: string } =>
      t.zoneId !== NO_ZONE && !!t.exitDate && t.exitDate >= today
      && dayjs(t.exitDate).diff(dayjs(t.entryDate), 'day') + 1 >= MIN_STAY_FOR_EXIT_REMINDER
    )
    .flatMap((t) => {
      const country = countryName(t.countryCode, lang);
      const date = formatDate(t.exitDate, 'D MMMM', lang);
      const journeyId = journeyOf(t.id, journeys);
      return [
        {
          kind: 'exit' as const,
          date: at(shift(t.exitDate, -1)),
          title: translate(lang, 'notify.exitTomorrowTitle', {country}),
          body: translate(lang, 'notify.exitTomorrowBody', {country, date}),
          journeyId,
        },
        {
          kind: 'exit' as const,
          date: at(shift(t.exitDate, 1)),
          title: translate(lang, 'notify.exitCheckTitle', {country}),
          body: translate(lang, 'notify.exitCheckBody', {date}),
          journeyId,
        },
      ];
    });
}

// 3. Documents: once a residence status expires, days in that country count again.
function documentAlerts({docs, lang}: PlanInput): PlannedNotification[] {
  return docs.residences.flatMap((doc) => {
    if (!doc.validUntil) return [];
    const validUntil = doc.validUntil;
    const kind = translate(lang, `docs.kind.${doc.kind}` as TranslationKey);
    const country = countryName(doc.countryCode, lang);
    const date = formatDate(validUntil, 'D MMMM YYYY', lang);
    return DOCUMENT_LEAD_DAYS.map((days) => ({
      kind: 'document' as const,
      date: at(shift(validUntil, -days)),
      title: translate(lang, 'notify.documentTitle', {kind, country, count: days}),
      body: translate(lang, 'notify.documentBody', {date}),
    }));
  });
}
