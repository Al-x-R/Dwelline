import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/uk';

import type { Language } from '../i18n/types';
import type { TFunction } from '../i18n';

export function toStartOfDay(date: Date | null | undefined): Date | undefined {
  if (!date) return undefined;
  return dayjs(date).startOf('day').toDate();
}

export function formatDate(date: string | Date | dayjs.Dayjs, pattern: string, lang: Language): string {
  return dayjs(date).locale(lang).format(pattern);
}

// "14:05" | "14.05" → minutes since midnight.
export function parseTime(value?: string | null): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function legDurationMinutes(
  departureDate: string | null,
  departureTime: string | null | undefined,
  arrivalDate: string | null,
  arrivalTime: string | null | undefined
): number | null {
  const dep = parseTime(departureTime);
  const arr = parseTime(arrivalTime);
  if (dep === null || arr === null) return null;
  const dayDiff = departureDate && arrivalDate ? dayjs(arrivalDate).diff(dayjs(departureDate), 'day') : 0;
  let diff = dayDiff * 24 * 60 + arr - dep;
  if (!departureDate || !arrivalDate) {
    if (diff < 0) diff += 24 * 60;
  }
  return diff > 0 ? diff : null;
}

// Travel time stays in hours ("33 h 40 min"); `days` is for stays, where past a day minutes are noise ("2 d 5 h").
export function formatDuration(minutes: number, t: TFunction, {days = false}: { days?: boolean } = {}): string {
  if (days && minutes >= 24 * 60) {
    const d = Math.floor(minutes / (24 * 60));
    const dh = Math.floor((minutes % (24 * 60)) / 60);
    return dh === 0 ? t('duration.days', {d}) : t('duration.daysHours', {d, h: dh});
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t('duration.minutes', {m});
  if (m === 0) return t('duration.hours', {h});
  return t('duration.hoursMinutes', {h, m});
}

export function timeFromDate(date: Date): string {
  return dayjs(date).format('HH:mm');
}

export function dateWithTime(base: Date, time: string | null | undefined): Date {
  const minutes = parseTime(time) ?? 12 * 60;
  return dayjs(base).startOf('day').add(minutes, 'minute').toDate();
}

const DATE_TOKENS: Record<Language, { D: string; M: string; Y: string }> = {
  ru: {D: 'Д', M: 'М', Y: 'Г'},
  uk: {D: 'Д', M: 'М', Y: 'Р'},
  en: {D: 'D', M: 'M', Y: 'Y'},
};

// 'DD.MM.YYYY' → localized placeholder letters (e.g. 'ДД.ММ.ГГГГ' for Russian).
export function displayDateFormat(pattern: string, lang: Language): string {
  const tokens = DATE_TOKENS[lang];
  return pattern.replace(/[DMY]/g, (c) => tokens[c as 'D' | 'M' | 'Y']);
}
