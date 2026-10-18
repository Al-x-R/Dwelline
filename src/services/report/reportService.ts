import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { todayIso } from '../../core/zoneAnalytics';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripsStore } from '../../store/tripsStore';
import { useZonesStore } from '../../store/zonesStore';
import { renderReportHtml } from './reportHtml';
import { buildReportModel } from './reportModel';

// A4 at 72 dpi.
const PAGE = {width: 595, height: 842};
// iOS ignores @page margins in the HTML; Android only reads them from there.
const IOS_MARGINS = {top: 28, right: 28, bottom: 28, left: 28};

export async function shareReportPdf(dialogTitle: string): Promise<void> {
  const settings = useSettingsStore.getState();
  const zones = useZonesStore.getState();
  const today = todayIso();
  const model = buildReportModel({
    trips: useTripsStore.getState().trips,
    zones: zones.getActiveZones(),
    allZones: zones.getAllZones(),
    docs: {passports: settings.passports, residences: settings.residences},
    bufferDays: settings.safetyBufferDays,
    today,
  });
  const html = renderReportHtml(model, {lang: settings.language, dateFormat: settings.dateFormat});

  const {uri} = await Print.printToFileAsync({html, ...PAGE, margins: IOS_MARGINS});
  // The printed file gets a random name; give the shared copy a readable one.
  const target = new File(Paths.cache, `Dwelline-report-${today}.pdf`);
  if (target.exists) target.delete();
  await new File(uri).move(target);

  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(target.uri, {mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle});
}
