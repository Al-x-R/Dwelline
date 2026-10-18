import type { ZoneConfig } from '../constants/zones';
import { allRules, type StayRules } from '../core/schengenCalculator';
import { resolveZoneAccess, type TravelDocuments } from '../core/zoneAccess';
import { zoneRules } from '../core/zoneAnalytics';
import { translate, type Language, type TranslationKey } from '../i18n';

// Hook-free zone labels, for places without React: notifications, PDF reports.

export function zoneName(zone: ZoneConfig | undefined | null, lang: Language): string {
  if (!zone) return translate(lang, 'zone.none');
  return zone.isCustom ? zone.name : translate(lang, `zone.${zone.id}` as TranslationKey);
}

// One rule, e.g. "90/180", "30 d/visit", "6 months/visit".
export function stayRuleLabel(r: StayRules, lang: Language): string {
  if (r.kind === 'per_visit') {
    return r.maxStayMonths
      ? translate(lang, 'zone.rulePerVisitMonths', {months: r.maxStayMonths})
      : translate(lang, 'zone.rulePerVisit', {max: r.maxStayDays});
  }
  return translate(lang, 'zone.rule', {max: r.maxStayDays, window: r.windowSizeDays});
}

// Rule as it applies to the user's documents, e.g. "90/180", "30 d/visit · 90/180", "No limit".
export function zoneRuleLabel(zone: ZoneConfig | undefined | null, docs: TravelDocuments, lang: Language): string {
  if (!zone) return translate(lang, 'zone.rule', {max: 90, window: 180});
  const access = resolveZoneAccess(zone, docs);
  if (access.mode === 'free') return translate(lang, 'zone.ruleFree');
  const rules = access.constraints.length ? access.constraints.flatMap(allRules) : allRules(zoneRules(zone));
  return rules.map((r) => stayRuleLabel(r, lang)).join(' · ');
}
