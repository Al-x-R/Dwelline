import type { Language } from '../i18n/types';

// Placeholder prices until the store products are wired in (RevenueCat returns localized prices per region).
export const PRICE_CURRENCY = 'USD';

export type PlanId = 'annual' | 'semiannual' | 'monthly' | 'lifetime';

export interface PlanPrice {
  id: PlanId;
  price: number;
  // Billing period; null for a one-time purchase.
  months: number | null;
  // Shown struck through while a launch price is on; must be the price the plan really moves to afterwards.
  regularPrice?: number;
}

export const PLAN_PRICES: Record<PlanId, PlanPrice> = {
  monthly: {id: 'monthly', price: 4.99, months: 1},
  semiannual: {id: 'semiannual', price: 14.99, months: 6},
  annual: {id: 'annual', price: 24.99, months: 12},
  lifetime: {id: 'lifetime', price: 49.99, months: null, regularPrice: 69.99},
};

export const TRIAL_DAYS = 7;

const LOCALES: Record<Language, string> = {ru: 'ru-RU', uk: 'uk-UA', en: 'en-US'};

export function formatPrice(amount: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALES[lang], {style: 'currency', currency: PRICE_CURRENCY}).format(amount);
}

// What a subscription costs per month, rounded down to the cent so the shown figure never overstates the deal.
export function pricePerMonth(plan: PlanPrice): number | null {
  return plan.months ? Math.floor((plan.price / plan.months) * 100) / 100 : null;
}

// Saving against paying monthly for the same period, in whole percent (rounded down).
export function savingsPercent(plan: PlanPrice): number {
  if (!plan.months || plan.months === 1) return 0;
  const monthly = PLAN_PRICES.monthly.price * plan.months;
  return Math.floor((1 - plan.price / monthly) * 100);
}
