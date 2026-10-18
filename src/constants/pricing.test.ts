import { formatPrice, PLAN_PRICES, pricePerMonth, savingsPercent } from './pricing';

describe('pricing', () => {
  it('works out the monthly cost of each subscription', () => {
    expect(pricePerMonth(PLAN_PRICES.annual)).toBe(2.08);
    expect(pricePerMonth(PLAN_PRICES.semiannual)).toBe(2.49);
    expect(pricePerMonth(PLAN_PRICES.monthly)).toBe(4.99);
    expect(pricePerMonth(PLAN_PRICES.lifetime)).toBeNull();
  });

  it('compares longer plans with paying monthly', () => {
    expect(savingsPercent(PLAN_PRICES.annual)).toBe(58);
    expect(savingsPercent(PLAN_PRICES.semiannual)).toBe(49);
    expect(savingsPercent(PLAN_PRICES.monthly)).toBe(0);
    expect(savingsPercent(PLAN_PRICES.lifetime)).toBe(0);
  });

  it('keeps a launch price below the regular one', () => {
    for (const plan of Object.values(PLAN_PRICES)) {
      if (plan.regularPrice !== undefined) expect(plan.regularPrice).toBeGreaterThan(plan.price);
    }
    expect(PLAN_PRICES.lifetime.regularPrice).toBe(69.99);
  });

  it('formats prices for the app language', () => {
    expect(formatPrice(24.99, 'en')).toBe('$24.99');
    expect(formatPrice(24.99, 'ru').replace(/\s/g, ' ')).toBe('24,99 $');
  });
});
