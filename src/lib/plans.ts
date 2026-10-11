import { t } from '@/i18n';
import { config } from './config';

export type PlanId = 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  productId: string;
  /** Numeric price in `currency`, for comparisons only. Display `priceString`. */
  price: number;
  priceString: string;
  currency: string;
  /** Free-trial length the store will grant this user, or null (no trial / not eligible). */
  trialDays: number | null;
}

/** "$29.99" -> "$2.50": a per-month figure in the same currency format as the store string. */
export function perMonthLabel(plan: Plan): string {
  const monthly = plan.id === 'yearly' ? plan.price / 12 : plan.price;
  const symbol = plan.priceString.match(/^[^\d\s]+/)?.[0] ?? '';
  const suffix = symbol ? '' : plan.priceString.match(/[^\d\s.,]+$/)?.[0] ?? '';
  return `${symbol}${monthly.toFixed(2)}${suffix}`;
}

/** Whole-number percentage the yearly plan saves versus twelve monthly payments. */
export function savingsPercent(monthly: Plan, yearly: Plan): number {
  const full = monthly.price * 12;
  if (full <= 0) return 0;
  return Math.max(0, Math.round((1 - yearly.price / full) * 100));
}

/** Full period word ('month' / 'year') and the short form used next to prices ('mo' / 'yr'). */
export const periodLabel = (id: PlanId) => t(id === 'yearly' ? 'plans.year' : 'plans.month');
export const periodShort = (id: PlanId) => t(id === 'yearly' ? 'plans.yearShort' : 'plans.monthShort');

export const trialLabel = (days: number) => t('plans.trialLabel', { count: days });

/** Text for the main purchase button. */
export function ctaLabel(plan: Plan): string {
  return plan.trialDays ? t('plans.startTrial', { trial: trialLabel(plan.trialDays) }) : t('plans.continuePrice', { price: plan.priceString, period: periodLabel(plan.id) });
}

/** The one line that must sit next to the button: what you pay and when. */
export function billingLine(plan: Plan): string {
  const price = t('plans.pricePer', { price: plan.priceString, period: periodLabel(plan.id) });
  if (plan.trialDays) return t('plans.billingTrial', { days: plan.trialDays, price });
  return t(plan.id === 'yearly' ? 'plans.billingYearly' : 'plans.billingMonthly', { price });
}

/** Converts a store billing period to days (approximate for months/years). */
export function periodToDays(unit: string, value: number): number {
  switch (unit.toUpperCase()) {
    case 'DAY':
      return value;
    case 'WEEK':
      return value * 7;
    case 'MONTH':
      return value * 30;
    case 'YEAR':
      return value * 365;
    default:
      return 0;
  }
}

/** Plans shown before the store responds (and in builds without store keys). Trial text reflects our configured offer. */
export const fallbackPlans = (): Plan[] => [
  { id: 'monthly', productId: config.proProductId, price: config.fallbackMonthlyPrice, priceString: `$${config.fallbackMonthlyPrice.toFixed(2)}`, currency: 'USD', trialDays: null },
  { id: 'yearly', productId: config.proYearlyProductId, price: config.fallbackYearlyPrice, priceString: `$${config.fallbackYearlyPrice.toFixed(2)}`, currency: 'USD', trialDays: config.trialDays },
];
