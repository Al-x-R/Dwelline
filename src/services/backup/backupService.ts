import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { BUILT_IN_ZONES } from '../../constants/zones';
import { useJourneysStore } from '../../store/journeysStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripsStore } from '../../store/tripsStore';
import { useZonesStore } from '../../store/zonesStore';
import { backupFileName, buildBackup, parseBackup, type BackupData, type BackupFile, type ParseResult } from './backupFormat';

// The data as it was right before the last import, so a wrong file can be undone.
const UNDO_KEY = '@dwelline/pre_import_backup';
// A real backup is a few hundred KB at most; anything far larger is not ours.
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function snapshot(): BackupData {
  const s = useSettingsStore.getState();
  const {customZones, activeZoneIds} = useZonesStore.getState();
  return {
    trips: useTripsStore.getState().trips,
    journeys: useJourneysStore.getState().journeys,
    customZones,
    activeZoneIds,
    settings: {
      language: s.language,
      autoRegional: s.autoRegional,
      dateFormat: s.dateFormat,
      weekStart: s.weekStart,
      themeMode: s.themeMode,
      selectedZoneId: s.selectedZoneId,
      safetyBufferDays: s.safetyBufferDays,
      passports: s.passports,
      residences: s.residences,
      overstayAlerts: s.overstayAlerts,
      rollOffAlerts: s.rollOffAlerts,
      exitReminders: s.exitReminders,
      documentAlerts: s.documentAlerts,
    },
  };
}

export async function exportBackup(dialogTitle: string): Promise<void> {
  const now = new Date();
  const file = new File(Paths.cache, backupFileName(now));
  file.create({overwrite: true});
  file.write(JSON.stringify(buildBackup(snapshot(), now), null, 2));
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, {mimeType: 'application/json', UTI: 'public.json', dialogTitle});
}

// Null when the user closed the picker.
export async function pickBackup(): Promise<ParseResult | null> {
  // Any type: files passed through messengers often lose their JSON mime type; the content is checked instead.
  const picked = await File.pickFileAsync({mimeTypes: '*/*'});
  if (picked.canceled) return null;
  if (picked.result.size > MAX_FILE_BYTES) return {ok: false, error: 'not_backup'};
  return parseBackup(await picked.result.text());
}

async function apply({trips, journeys, customZones, activeZoneIds, settings}: BackupData): Promise<void> {
  const zones = customZones.map((z) => ({...z, isCustom: true, isImplemented: true}));
  await useZonesStore.getState().restoreZones(zones, activeZoneIds.length > 0 ? activeZoneIds : ['schengen']);
  await useTripsStore.getState().setAllTrips(trips);
  await useJourneysStore.getState().setAllJourneys(journeys);

  const s = useSettingsStore.getState();
  if (settings.language) s.setLanguage(settings.language);
  if (settings.themeMode) s.setThemeMode(settings.themeMode);
  s.setRegional({autoRegional: settings.autoRegional, dateFormat: settings.dateFormat, weekStart: settings.weekStart});
  const zoneExists = [...BUILT_IN_ZONES, ...zones].some((z) => z.id === settings.selectedZoneId);
  if (settings.selectedZoneId && zoneExists) s.setSelectedZoneId(settings.selectedZoneId);
  if (settings.safetyBufferDays !== undefined) s.setSafetyBufferDays(settings.safetyBufferDays);
  if (settings.passports) s.setPassports(settings.passports);
  if (settings.residences) s.setResidences(settings.residences);
  s.setAlerts({
    overstayAlerts: settings.overstayAlerts ?? s.overstayAlerts,
    rollOffAlerts: settings.rollOffAlerts ?? s.rollOffAlerts,
    exitReminders: settings.exitReminders ?? s.exitReminders,
    documentAlerts: settings.documentAlerts ?? s.documentAlerts,
  });
}

// Replaces all data with the backup; what was there before is kept for undoImport.
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await AsyncStorage.setItem(UNDO_KEY, JSON.stringify(buildBackup(snapshot(), new Date())));
  await apply(backup.data);
}

export async function hasUndoCopy(): Promise<boolean> {
  return (await AsyncStorage.getItem(UNDO_KEY)) !== null;
}

export async function undoImport(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(UNDO_KEY);
  const parsed = raw ? parseBackup(raw) : null;
  if (!parsed?.ok) return false;
  await apply(parsed.backup.data);
  await AsyncStorage.removeItem(UNDO_KEY);
  return true;
}
