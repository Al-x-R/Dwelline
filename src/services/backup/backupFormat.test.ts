import { BACKUP_VERSION, backupFileName, buildBackup, parseBackup, type BackupData } from './backupFormat';

const data: BackupData = {
  trips: [
    {id: 't1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-01-01', exitDate: '2026-01-10'},
    {id: 't2', zoneId: 'turkey', countryCode: 'TR', entryDate: '2026-10-10', exitDate: null},
  ],
  journeys: [{
    id: 'j1', name: 'Test', originCountryName: null, originCountryFlag: null, originDepartureTime: null,
    originTransportMode: null, destinationCountryName: null, destinationCountryFlag: null,
    destinationArrivalTime: null, turnaroundTripId: null, tripIds: ['t2'], createdAt: '2026-10-01T10:00:00.000Z',
  }],
  customZones: [{
    id: 'custom_1', name: 'My zone', flag: '🏳️', ruleType: 'per_visit', maxStayDays: 30,
    isMultiCountry: false, isImplemented: true, isCustom: true, countryCodes: ['TH'],
  }],
  activeZoneIds: ['schengen', 'turkey', 'custom_1'],
  settings: {
    language: 'ru', safetyBufferDays: 14, passports: ['UA'],
    residences: [{countryCode: 'PL', kind: 'temporary_protection', validUntil: '2027-03-04'}],
  },
};

const now = new Date('2026-10-18T12:00:00.000Z');

function withData(patch: Partial<Record<keyof BackupData, unknown>>): string {
  const file = buildBackup(data, now);
  return JSON.stringify({...file, data: {...file.data, ...patch}});
}

describe('backup format', () => {
  it('round-trips everything it exports', () => {
    const result = parseBackup(JSON.stringify(buildBackup(data, now)));
    expect(result).toEqual({ok: true, backup: {app: 'dwelline', version: BACKUP_VERSION, exportedAt: now.toISOString(), data}});
  });

  it('names the file after the export date', () => {
    expect(backupFileName(now)).toBe('dwelline-backup-2026-10-18.json');
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('id,country\n1,FR')).toEqual({ok: false, error: 'not_json'});
  });

  it('rejects JSON from another app', () => {
    expect(parseBackup(JSON.stringify({trips: []}))).toEqual({ok: false, error: 'not_backup'});
  });

  it('rejects a backup from a newer app version instead of guessing', () => {
    const file = {...buildBackup(data, now), version: BACKUP_VERSION + 1};
    expect(parseBackup(JSON.stringify(file))).toEqual({ok: false, error: 'newer_version'});
  });

  it('rejects the whole file when a single trip is broken', () => {
    const trips = [...data.trips, {id: 't3', zoneId: 'schengen', countryCode: 'DE', entryDate: '10.01.2026', exitDate: null}];
    expect(parseBackup(withData({trips}))).toEqual({ok: false, error: 'invalid_data'});
  });

  it('rejects a trip that ends before it starts', () => {
    const trips = [{id: 't1', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-02-01', exitDate: '2026-01-01'}];
    expect(parseBackup(withData({trips}))).toEqual({ok: false, error: 'invalid_data'});
  });

  it('rejects a backup without trips', () => {
    expect(parseBackup(withData({trips: undefined}))).toEqual({ok: false, error: 'invalid_data'});
  });

  it('treats missing zones as none', () => {
    const result = parseBackup(withData({customZones: undefined, activeZoneIds: undefined}));
    expect(result.ok && result.backup.data.customZones).toEqual([]);
    expect(result.ok && result.backup.data.activeZoneIds).toEqual([]);
  });

  it('drops malformed or unknown preferences but keeps the rest', () => {
    const settings = {language: 'en', safetyBufferDays: 'many', weekStart: 3, themeMode: 'neon', hacker: true, exitReminders: false};
    const result = parseBackup(withData({settings}));
    expect(result.ok && result.backup.data.settings).toEqual({language: 'en', exitReminders: false});
  });
});
