import { BUILT_IN_ZONES } from '../../constants/zones';
import type { Trip } from '../../types/Trip';
import { escapeHtml, renderReportHtml } from './reportHtml';
import { buildReportModel, mergeStays, type ReportInput } from './reportModel';

// i18n pulls in the settings store and native Expo modules; only the dictionaries are needed here.
jest.mock('expo-localization', () => ({getLocales: () => [], getCalendars: () => []}));
jest.mock('../../store/settingsStore', () => ({useSettingsStore: jest.fn()}));

const zone = (id: string) => BUILT_IN_ZONES.find((z) => z.id === id)!;
const trip = (patch: Partial<Trip> & Pick<Trip, 'id' | 'entryDate' | 'exitDate'>): Trip => ({
  zoneId: 'schengen', countryCode: 'PL', ...patch,
});

const today = '2026-10-18';

function input(patch: Partial<ReportInput>): ReportInput {
  return {
    trips: [],
    zones: [zone('schengen'), zone('turkey')],
    allZones: BUILT_IN_ZONES,
    docs: {passports: ['UA'], residences: []},
    bufferDays: 14,
    today,
    ...patch,
  };
}

describe('buildReportModel', () => {
  it('lists trips of the last 12 months, oldest first, and skips older ones', () => {
    const model = buildReportModel(input({
      trips: [
        trip({id: 'b', entryDate: '2026-09-01', exitDate: '2026-09-10'}),
        trip({id: 'old', entryDate: '2025-01-01', exitDate: '2025-01-10'}),
        trip({id: 'a', entryDate: '2025-10-15', exitDate: '2025-10-25'}),
      ],
    }));
    expect(model.historyStart).toBe('2025-10-19');
    expect(model.trips.map((t) => t.entryDate)).toEqual(['2025-10-15', '2026-09-01']);
  });

  it('shows only tracked zones that have trips in the period', () => {
    const model = buildReportModel(input({trips: [trip({id: '1', entryDate: '2026-09-01', exitDate: '2026-09-10'})]}));
    expect(model.zones.map((z) => z.zone.id)).toEqual(['schengen']);
  });

  it('counts days in the 180-day window and finds the exit date for an ongoing stay', () => {
    const model = buildReportModel(input({trips: [trip({id: '1', entryDate: '2026-10-01', exitDate: null})]}));
    const [schengen] = model.zones;
    expect(schengen.daysUsed).toBe(18);
    expect(schengen.daysRemaining).toBe(72);
    expect(schengen.periodStart).toBe('2026-04-22');
    expect(schengen.exitDeadline).toBe('2026-12-29');
    expect(model.trips[0].exitDate).toBeNull();
    expect(model.trips[0].days).toBe(18);
  });

  it('reports an overstay with the number of days over', () => {
    const model = buildReportModel(input({trips: [trip({id: '1', entryDate: '2026-07-01', exitDate: '2026-10-08'})]}));
    expect(model.zones[0].isViolation).toBe(true);
    expect(model.zones[0].overageDays).toBe(10);
  });

  it('applies the passport rule: Russians in Turkey count per visit', () => {
    const model = buildReportModel(input({
      docs: {passports: ['RU'], residences: []},
      trips: [trip({id: '1', zoneId: 'turkey', countryCode: 'TR', entryDate: '2026-10-10', exitDate: null})],
    }));
    expect(model.zones[0].perVisit).toBe(true);
    expect(model.zones[0].rules.kind).toBe('per_visit');
  });

  it('marks future trips as planned and labels untracked zones', () => {
    const model = buildReportModel(input({
      trips: [trip({id: '1', zoneId: 'none', countryCode: 'UA', entryDate: '2026-11-01', exitDate: '2026-11-05'})],
    }));
    expect(model.trips[0]).toMatchObject({planned: true, zone: null, days: 5});
  });
});

describe('mergeStays', () => {
  it('collapses duplicated trips into one stay', () => {
    const dup = {zoneId: 'moldova', countryCode: 'MD', entryDate: '2026-07-31', exitDate: '2026-08-01'};
    const merged = mergeStays([{id: '1', ...dup}, {id: '2', ...dup}, {id: '3', ...dup}], today);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({entryDate: '2026-07-31', exitDate: '2026-08-01'});
  });

  it('joins overlapping and back-to-back stays in the same country', () => {
    const merged = mergeStays([
      trip({id: '1', entryDate: '2026-05-01', exitDate: '2026-05-10'}),
      trip({id: '2', entryDate: '2026-05-08', exitDate: '2026-05-20'}),
      trip({id: '3', entryDate: '2026-05-21', exitDate: '2026-05-25'}),
    ], today);
    expect(merged.map((t) => [t.entryDate, t.exitDate])).toEqual([['2026-05-01', '2026-05-25']]);
  });

  it('keeps stays apart when there is a gap or the country differs', () => {
    const merged = mergeStays([
      trip({id: '1', entryDate: '2026-05-01', exitDate: '2026-05-10'}),
      trip({id: '2', entryDate: '2026-05-12', exitDate: '2026-05-20'}),
      trip({id: '3', countryCode: 'DE', entryDate: '2026-05-05', exitDate: '2026-05-06'}),
    ], today);
    expect(merged.map((t) => `${t.countryCode} ${t.entryDate}`)).toEqual(['PL 2026-05-01', 'DE 2026-05-05', 'PL 2026-05-12']);
  });

  it('keeps an ongoing stay open after merging', () => {
    const merged = mergeStays([
      trip({id: '1', entryDate: '2026-10-01', exitDate: '2026-10-05'}),
      trip({id: '2', entryDate: '2026-10-03', exitDate: null}),
    ], today);
    expect(merged).toEqual([expect.objectContaining({entryDate: '2026-10-01', exitDate: null})]);
  });
});

describe('renderReportHtml', () => {
  const model = buildReportModel(input({
    trips: [trip({id: '1', entryDate: '2026-10-01', exitDate: null})],
    docs: {passports: ['UA'], residences: [{countryCode: 'DE', kind: 'temporary_protection', validUntil: '2027-03-04'}]},
  }));

  it('carries English labels with the app language under them', () => {
    const html = renderReportHtml(model, {lang: 'ru', dateFormat: 'DD.MM.YYYY'});
    expect(html).toContain('Stay report');
    expect(html).toContain('Отчёт о пребывании');
    expect(html).toContain('Ukraine (UA)');
    expect(html).toContain('Temporary protection');
  });

  it('formats dates with the numeric pattern', () => {
    const html = renderReportHtml(model, {lang: 'ru', dateFormat: 'DD.MM.YYYY'});
    expect(html).toContain('18.10.2026');
    expect(html).toContain('29.12.2026');
    expect(html).toContain('04.03.2027');
  });

  it('does not repeat labels when the app is in English', () => {
    const html = renderReportHtml(model, {lang: 'en', dateFormat: 'DD.MM.YYYY'});
    expect(html).not.toContain('class="loc"');
  });

  it('escapes user-entered text such as custom zone names', () => {
    const custom = {...zone('schengen'), id: 'c1', isCustom: true, name: '<script>x</script>', countryCodes: ['TH']};
    const html = renderReportHtml(buildReportModel(input({
      zones: [custom],
      allZones: [...BUILT_IN_ZONES, custom],
      trips: [trip({id: '1', zoneId: 'c1', countryCode: 'TH', entryDate: '2026-10-01', exitDate: '2026-10-05'})],
    })), {lang: 'en', dateFormat: 'DD.MM.YYYY'});
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });
});
