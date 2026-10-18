import dayjs from 'dayjs';

import { allRules } from '../../core/schengenCalculator';
import { countryName } from '../../constants/countries';
import type { ZoneConfig } from '../../constants/zones';
import { translate, type Language, type TranslationKey } from '../../i18n';
import type { TranslationParams } from '../../i18n/types';
import { stayRuleLabel, zoneName } from '../../utils/zoneLabels';
import type { ReportModel, ReportTrip, ReportZone } from './reportModel';

// The report is read by border officers (English) and by the traveller (app language), so every label carries both.
export interface ReportOptions {
  lang: Language;
  // Numeric pattern, e.g. DD.MM.YYYY: readable whatever the officer's language.
  dateFormat: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function both(en: string, local: string): string {
  const main = `<span class="en">${escapeHtml(en)}</span>`;
  return en === local ? main : `${main}<span class="loc">${escapeHtml(local)}</span>`;
}

export function renderReportHtml(model: ReportModel, {lang, dateFormat}: ReportOptions): string {
  const label = (key: TranslationKey, params?: TranslationParams) =>
    both(translate('en', key, params), translate(lang, key, params));
  const date = (iso: string) => dayjs(iso).format(dateFormat);
  // "Label: value" on the English line, the translated label under it.
  const labelled = (key: TranslationKey, valueHtml: string) => {
    const en = escapeHtml(translate('en', key));
    const local = translate(lang, key);
    return `<span class="en">${en}: <b>${valueHtml}</b></span>${lang === 'en' ? '' : `<span class="loc">${escapeHtml(local)}</span>`}`;
  };
  const country = (code: string) => {
    const en = countryName(code, 'en');
    const local = countryName(code, lang);
    return both(`${en} (${code})`, local === en ? `${local} (${code})` : local);
  };
  const zone = (z: ZoneConfig | null) => (z ? both(zoneName(z, 'en'), zoneName(z, lang)) : label('report.untracked'));

  const zoneRule = (z: ReportZone) => {
    if (z.free) return label('report.statusFree');
    const rules = allRules(z.rules);
    return both(rules.map((r) => stayRuleLabel(r, 'en')).join(' · '), rules.map((r) => stayRuleLabel(r, lang)).join(' · '));
  };

  const zoneStatus = (z: ReportZone) => {
    if (z.free) return `<span class="badge safe">${label('report.statusFree')}</span>`;
    const status = z.isViolation
      ? `<span class="badge danger">${label('report.statusOverstay', {count: z.overageDays})}</span>`
      : `<span class="badge ${z.tone}">${label('report.statusOk')}</span>`;
    const exit = z.exitDeadline ? `<div class="note">${labelled('report.exitBy', date(z.exitDeadline))}</div>` : '';
    return status + exit;
  };

  const zonePeriod = (z: ReportZone) => {
    if (z.free) return '—';
    const range = `${date(z.periodStart)} – ${date(z.periodEnd)}`;
    if (!z.perVisit) return range;
    // Per-visit rules only look at the stay in progress; outside the zone there is nothing to check.
    return z.daysUsed > 0 ? `${label('report.currentVisit')}<div class="note">${range}</div>` : '—';
  };

  const zoneRow = (z: ReportZone) => `
    <tr>
      <td>${zone(z.zone)}</td>
      <td>${zoneRule(z)}</td>
      <td>${zonePeriod(z)}</td>
      <td class="num">${z.free ? '—' : `<b>${z.daysUsed}</b> / ${z.maxDays}`}</td>
      <td class="num">${z.free ? '—' : z.daysRemaining}</td>
      <td>${zoneStatus(z)}</td>
    </tr>`;

  const tripRow = (t: ReportTrip) => `
    <tr${t.planned ? ' class="planned"' : ''}>
      <td>${country(t.countryCode)}</td>
      <td>${zone(t.zone)}</td>
      <td class="num">${date(t.entryDate)}</td>
      <td class="num">${t.exitDate ? date(t.exitDate) : t.planned ? '—' : label('report.stillThere')}</td>
      <td class="num">${t.planned && !t.exitDate ? '—' : t.days}${t.planned ? `<div class="note">${label('report.planned')}</div>` : ''}</td>
    </tr>`;

  // One sentence per language, so the two lines read on their own.
  const residence = (r: ReportModel['residences'][number], l: Language) => {
    const validity = r.validUntil ? translate(l, 'report.validUntil', {date: date(r.validUntil)}) : translate(l, 'report.noExpiry');
    const where = l === 'en' ? `${countryName(r.countryCode, l)} (${r.countryCode})` : countryName(r.countryCode, l);
    return `${translate(l, `docs.kind.${r.kind}` as TranslationKey)} — ${where}, ${validity}`;
  };
  const residences = model.residences.map((r) => `<div>${both(residence(r, 'en'), residence(r, lang))}</div>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 28px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: #111827; font-size: 11px; margin: 0; }
  .loc { display: block; color: #6b7280; font-size: 0.85em; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 10px; }
  h1 { font-size: 20px; margin: 0; }
  h1 .loc { font-size: 13px; font-weight: 500; }
  .brand { text-align: right; color: #374151; }
  .brand > b { display: block; font-size: 13px; color: #111827; }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.04em; }
  h2 .loc { text-transform: none; letter-spacing: 0; font-weight: 500; }
  .facts > div > div + div { margin-top: 4px; }
  .facts { display: grid; grid-template-columns: 160px 1fr; gap: 4px 12px; margin-top: 12px; }
  .facts > div:nth-child(odd) { color: #374151; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; color: #374151; border-bottom: 1px solid #9ca3af; padding: 4px 6px; vertical-align: bottom; }
  td { border-bottom: 1px solid #e5e7eb; padding: 5px 6px; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .num { white-space: nowrap; }
  .planned td { color: #6b7280; font-style: italic; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
  .badge .loc { font-weight: 400; }
  .safe { background: #dcfce7; color: #166534; }
  .warning { background: #fef3c7; color: #92400e; }
  .danger { background: #fee2e2; color: #991b1b; }
  .note { margin-top: 3px; color: #374151; font-style: normal; }
  .empty { color: #6b7280; padding: 8px 0; }
  footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #d1d5db; color: #4b5563; font-size: 9.5px; }
  footer p { margin: 0 0 6px; }
</style>
</head>
<body>
  <header>
    <h1>${label('report.title')}</h1>
    <div class="brand"><b>Dwelline</b>${labelled('report.generated', date(model.today))}</div>
  </header>

  <div class="facts">
    <div>${label('report.passports')}</div>
    <div>${model.passports.length ? model.passports.map((p) => `<div>${country(p)}</div>`).join('') : '—'}</div>
    <div>${label('report.residences')}</div>
    <div>${residences || '—'}</div>
  </div>

  <h2>${label('report.zones')}</h2>
  ${model.zones.length ? `<table>
    <thead><tr>
      <th>${label('report.zone')}</th>
      <th>${label('report.rule')}</th>
      <th>${label('report.period')}</th>
      <th>${label('report.daysUsed')}</th>
      <th>${label('report.daysLeft')}</th>
      <th>${label('report.status')}</th>
    </tr></thead>
    <tbody>${model.zones.map(zoneRow).join('')}</tbody>
  </table>` : '<div class="empty">—</div>'}

  <h2>${label('report.trips', {date: date(model.historyStart)})}</h2>
  ${model.trips.length ? `<table>
    <thead><tr>
      <th>${label('report.country')}</th>
      <th>${label('report.zone')}</th>
      <th>${label('report.entry')}</th>
      <th>${label('report.exit')}</th>
      <th>${label('report.days')}</th>
    </tr></thead>
    <tbody>${model.trips.map(tripRow).join('')}</tbody>
  </table>` : '<div class="empty">—</div>'}

  <footer>
    <p>${label('report.method')}</p>
    <p>${label('report.disclaimer')}</p>
  </footer>
</body>
</html>`;
}
