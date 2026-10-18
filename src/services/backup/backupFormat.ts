import type { ZoneConfig } from '../../constants/zones';
import { LANGUAGES, type Language } from '../../i18n/types';
import type { DateFormat, ThemeMode, WeekStart } from '../../store/settingsStore';
import type { ResidenceDoc } from '../../types/documents';
import type { Journey } from '../../types/Journey';
import type { Trip } from '../../types/Trip';

// Bump when the shape changes; parseBackup must keep reading every older version.
export const BACKUP_VERSION = 1;
const APP_ID = 'dwelline';

// Preferences that travel with the data. Onboarding state stays per device.
export interface BackupSettings {
  language?: Language;
  autoRegional?: boolean;
  dateFormat?: DateFormat;
  weekStart?: WeekStart;
  themeMode?: ThemeMode;
  selectedZoneId?: string;
  safetyBufferDays?: number;
  passports?: string[];
  residences?: ResidenceDoc[];
  overstayAlerts?: boolean;
  rollOffAlerts?: boolean;
  exitReminders?: boolean;
  documentAlerts?: boolean;
}

export interface BackupData {
  trips: Trip[];
  journeys: Journey[];
  customZones: ZoneConfig[];
  activeZoneIds: string[];
  settings: BackupSettings;
}

export interface BackupFile {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export type BackupError = 'not_json' | 'not_backup' | 'newer_version' | 'invalid_data';

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: BackupError };

export function buildBackup(data: BackupData, now: Date): BackupFile {
  return {app: APP_ID, version: BACKUP_VERSION, exportedAt: now.toISOString(), data};
}

export function backupFileName(now: Date): string {
  return `dwelline-backup-${now.toISOString().slice(0, 10)}.json`;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isDate = (v: unknown): v is string => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const oneOf = (values: readonly unknown[]) => (v: unknown) => values.includes(v);
const optional = (v: unknown, check: (x: unknown) => boolean) => v === undefined || v === null || check(v);

function isTrip(v: unknown): v is Trip {
  return isObj(v)
    && isStr(v.id) && isStr(v.zoneId) && isStr(v.countryCode)
    && isDate(v.entryDate) && (v.exitDate === null || isDate(v.exitDate))
    && (v.exitDate === null || (v.exitDate as string) >= (v.entryDate as string))
    && optional(v.arrivalDate, isDate) && optional(v.departureDate, isDate);
}

function isJourney(v: unknown): v is Journey {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isStrArray(v.tripIds) && isStr(v.createdAt);
}

function isZone(v: unknown): v is ZoneConfig {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isStrArray(v.countryCodes)
    && (v.ruleType === 'rolling_window' || v.ruleType === 'per_visit');
}

function isResidence(v: unknown): v is ResidenceDoc {
  return isObj(v) && isStr(v.countryCode)
    && oneOf(['residence_permit', 'temporary_protection', 'national_visa_d'] satisfies ResidenceDoc['kind'][])(v.kind)
    && (v.validUntil === null || isDate(v.validUntil));
}

const SETTING_CHECKS: { [K in keyof BackupSettings]-?: (v: unknown) => boolean } = {
  language: oneOf(LANGUAGES),
  autoRegional: (v) => typeof v === 'boolean',
  dateFormat: oneOf(['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] satisfies DateFormat[]),
  weekStart: oneOf([0, 1] satisfies WeekStart[]),
  themeMode: oneOf(['system', 'light', 'dark'] satisfies ThemeMode[]),
  selectedZoneId: isStr,
  safetyBufferDays: (v) => typeof v === 'number' && Number.isFinite(v),
  passports: isStrArray,
  residences: (v) => Array.isArray(v) && v.every(isResidence),
  overstayAlerts: (v) => typeof v === 'boolean',
  rollOffAlerts: (v) => typeof v === 'boolean',
  exitReminders: (v) => typeof v === 'boolean',
  documentAlerts: (v) => typeof v === 'boolean',
};

// Unknown or malformed preferences are dropped one by one; they must not block restoring the trips.
function pickSettings(raw: unknown): BackupSettings {
  if (!isObj(raw)) return {};
  const result: Obj = {};
  for (const [key, check] of Object.entries(SETTING_CHECKS)) {
    if (raw[key] !== undefined && check(raw[key])) result[key] = raw[key];
  }
  return result as BackupSettings;
}

// Trips and journeys are all-or-nothing: restoring part of them would silently break the day counts.
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {ok: false, error: 'not_json'};
  }
  if (!isObj(raw) || raw.app !== APP_ID || typeof raw.version !== 'number' || !isObj(raw.data)) {
    return {ok: false, error: 'not_backup'};
  }
  if (raw.version > BACKUP_VERSION) return {ok: false, error: 'newer_version'};

  const {trips, journeys, customZones = [], activeZoneIds = [], settings} = raw.data;
  if (!Array.isArray(trips) || !trips.every(isTrip)
    || !Array.isArray(journeys) || !journeys.every(isJourney)
    || !Array.isArray(customZones) || !customZones.every(isZone)
    || !isStrArray(activeZoneIds)) {
    return {ok: false, error: 'invalid_data'};
  }

  return {
    ok: true,
    backup: {
      app: APP_ID,
      version: raw.version,
      exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : '',
      data: {trips, journeys, customZones, activeZoneIds, settings: pickSettings(settings)},
    },
  };
}
