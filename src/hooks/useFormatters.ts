import { useMemo } from 'react';
import type dayjs from 'dayjs';

import { useT } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { formatDate } from '../utils/format';

type DateInput = string | Date | dayjs.Dayjs;

export function useFormatters() {
  const {t, lang} = useT();
  const numericPattern = useSettingsStore((s) => s.dateFormat);

  return useMemo(
    () => ({
      // 12 May
      dayMonth: (d: DateInput) => formatDate(d, 'D MMMM', lang),
      // 12 May 2026
      full: (d: DateInput) => formatDate(d, 'D MMMM YYYY', lang),
      // 12 May (abbreviated month)
      short: (d: DateInput) => formatDate(d, 'D MMM', lang),
      shortYear: (d: DateInput) => formatDate(d, 'D MMM YYYY', lang),
      // August 2026
      monthYear: (d: DateInput) => {
        const s = formatDate(d, 'MMMM YYYY', lang);
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      weekday: (d: DateInput) => {
        const s = formatDate(d, 'dddd', lang);
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      // Per the date format setting: 12.05.2026 / 05/12/2026 / 2026-05-12
      numeric: (d: DateInput) => formatDate(d, numericPattern, lang),
      days: (count: number) => t('common.days', {count}),
    }),
    [lang, numericPattern, t]
  );
}
