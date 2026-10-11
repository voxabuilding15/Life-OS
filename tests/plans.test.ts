import { billingLine, ctaLabel, fallbackPlans, perMonthLabel, periodToDays, savingsPercent, trialLabel, type Plan } from '@/lib/plans';

const monthly: Plan = { id: 'monthly', productId: 'm', price: 4.99, priceString: '$4.99', currency: 'USD', trialDays: null };
const yearly: Plan = { id: 'yearly', productId: 'y', price: 29.99, priceString: '$29.99', currency: 'USD', trialDays: 7 };

describe('plans', () => {
  it('computes savings of yearly vs 12 months', () => {
    expect(savingsPercent(monthly, yearly)).toBe(50);
    expect(savingsPercent(monthly, { ...yearly, price: 80 })).toBe(0);
  });

  it('shows a per-month price for the yearly plan', () => {
    expect(perMonthLabel(yearly)).toBe('$2.50');
    expect(perMonthLabel(monthly)).toBe('$4.99');
    expect(perMonthLabel({ ...yearly, price: 24, priceString: '24,00 €' })).toBe('2.00€');
  });

  it('labels the button by trial eligibility', () => {
    expect(ctaLabel(yearly)).toBe('Start 7-day free trial');
    expect(ctaLabel({ ...yearly, trialDays: null })).toBe('Continue · $29.99/year');
    expect(ctaLabel(monthly)).toBe('Continue · $4.99/month');
    expect(trialLabel(7)).toBe('7-day free trial');
  });

  it('always states price and cancellation next to the button', () => {
    expect(billingLine(yearly)).toMatch(/7 days free, then \$29\.99\/year.*Cancel anytime/);
    expect(billingLine(monthly)).toMatch(/\$4\.99\/month.*Cancel anytime/);
  });

  it('converts store periods to days', () => {
    expect(periodToDays('DAY', 3)).toBe(3);
    expect(periodToDays('WEEK', 1)).toBe(7);
    expect(periodToDays('P', 1)).toBe(0);
  });

  it('has a sane fallback: yearly first-class with trial, monthly without', () => {
    const [m, y] = fallbackPlans();
    expect(m.trialDays).toBeNull();
    expect(y.trialDays).toBe(7);
    expect(y.price).toBeLessThan(m.price * 12);
  });
});
