import { BUILT_IN_ZONES } from '../../constants/zones';
import type { Trip } from '../../types/Trip';
import { MAX_SCHEDULED, NOTIFY_HOUR, planNotifications, type PlanInput } from './planNotifications';

// i18n pulls in the settings store and native Expo modules; only the dictionaries are needed here.
jest.mock('expo-localization', () => ({getLocales: () => [], getCalendars: () => []}));
jest.mock('../../store/settingsStore', () => ({useSettingsStore: jest.fn()}));

const trip = (patch: Partial<Trip> & Pick<Trip, 'id' | 'entryDate' | 'exitDate'>): Trip => ({
  zoneId: 'schengen', countryCode: 'PL', ...patch,
});

function input(patch: Partial<PlanInput>): PlanInput {
  return {
    trips: [],
    journeys: [],
    zones: BUILT_IN_ZONES,
    docs: {passports: [], residences: []},
    bufferDays: 14,
    prefs: {limit: true, exit: true, document: true},
    lang: 'en',
    now: new Date(2026, 9, 1, 12, 0), // 1 Oct 2026, noon
    ...patch,
  };
}

const day = (n: Date) => `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;

describe('limit alerts', () => {
  // In Schengen since 1 Sep with no exit: day 90 is 29 Nov.
  const open = trip({id: 'pl', entryDate: '2026-09-01', exitDate: null});

  it('counts down to the latest exit date and flags the overstay', () => {
    const plan = planNotifications(input({trips: [open], prefs: {limit: true, exit: false, document: false}}));
    expect(plan.map((n) => day(n.date))).toEqual([
      '2026-11-15', '2026-11-22', '2026-11-26', '2026-11-28', '2026-11-29', '2026-11-30',
    ]);
    expect(plan.every((n) => n.date.getHours() === NOTIFY_HOUR)).toBe(true);
    expect(plan[1].title).toBe('Schengen Area: 7 days to the latest exit date');
  });

  it('stays quiet when the planned exit fits the limit', () => {
    const planned = {...open, exitDate: '2026-10-20'};
    const plan = planNotifications(input({trips: [planned], prefs: {limit: true, exit: false, document: false}}));
    expect(plan).toEqual([]);
  });

  it('warns when the planned exit is past the limit', () => {
    const planned = {...open, exitDate: '2026-12-15'};
    const plan = planNotifications(input({trips: [planned], prefs: {limit: true, exit: false, document: false}}));
    expect(plan.length).toBe(6);
  });

  it('skips zones where a residence permit makes stays free', () => {
    const plan = planNotifications(input({
      trips: [open],
      docs: {passports: [], residences: [{countryCode: 'PL', kind: 'residence_permit', validUntil: null}]},
      prefs: {limit: true, exit: false, document: false},
    }));
    expect(plan).toEqual([]);
  });
});

describe('exit reminders', () => {
  it('reminds the day before and checks the day after a real stay', () => {
    const stay = trip({id: 'cy', zoneId: 'cyprus', countryCode: 'CY', entryDate: '2026-08-01', exitDate: '2026-10-20'});
    const plan = planNotifications(input({
      trips: [stay],
      journeys: [{id: 'j1', tripIds: ['cy']} as PlanInput['journeys'][number]],
      prefs: {limit: false, exit: true, document: false},
    }));
    expect(plan.map((n) => day(n.date))).toEqual(['2026-10-19', '2026-10-21']);
    expect(plan[0]).toMatchObject({title: 'Leaving tomorrow: Cyprus', journeyId: 'j1'});
  });

  it('ignores transits and untracked countries', () => {
    const transit = trip({id: 'md', zoneId: 'moldova', countryCode: 'MD', entryDate: '2026-10-10', exitDate: '2026-10-11'});
    const untracked = trip({id: 'ua', zoneId: 'none', countryCode: 'UA', entryDate: '2026-10-01', exitDate: '2026-10-30'});
    expect(planNotifications(input({trips: [transit, untracked], prefs: {limit: false, exit: true, document: false}}))).toEqual([]);
  });
});

describe('document alerts', () => {
  it('warns 30, 7 and 1 day before a residence status ends', () => {
    const plan = planNotifications(input({
      docs: {passports: [], residences: [{countryCode: 'PL', kind: 'residence_permit', validUntil: '2026-12-31'}]},
      prefs: {limit: false, exit: false, document: true},
    }));
    expect(plan.map((n) => day(n.date))).toEqual(['2026-12-01', '2026-12-24', '2026-12-30']);
  });
});

describe('planNotifications', () => {
  it('drops past reminders and caps the pending list', () => {
    const many = Array.from({length: 40}, (_, i) => trip({
      id: `t${i}`, zoneId: 'cyprus', countryCode: 'CY', entryDate: '2026-09-01', exitDate: `2027-0${1 + (i % 9)}-1${i % 10}`,
    }));
    const plan = planNotifications(input({trips: many, prefs: {limit: false, exit: true, document: false}}));
    expect(plan.length).toBe(MAX_SCHEDULED);
    expect(plan.every((n, i) => i === 0 || n.date >= plan[i - 1].date)).toBe(true);
  });
});
