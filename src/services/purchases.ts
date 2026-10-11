import { Platform } from 'react-native';
import { config } from '@/lib/config';
import { fallbackPlans, periodToDays, type Plan, type PlanId } from '@/lib/plans';
import { useSubscription } from '@/store/subscription';

/**
 * RevenueCat wrapper. The native SDK is loaded lazily so web/preview builds never touch it.
 * Entitlement truth lives in RevenueCat; the local store is a cache for offline use.
 */

type PurchasesModule = typeof import('react-native-purchases');
type CustomerInfo = import('react-native-purchases').CustomerInfo;
type Package = import('react-native-purchases').PurchasesPackage;

const apiKey = Platform.select({ ios: config.revenueCatIosKey, android: config.revenueCatAndroidKey, default: '' });
export const purchasesAvailable = Platform.OS !== 'web' && Boolean(apiKey);

let configured = false;
let cachedPackage: Package | null = null;

const sdk = (): PurchasesModule['default'] => (require('react-native-purchases') as PurchasesModule).default;

function applyCustomerInfo(info: CustomerInfo) {
  const ent = info.entitlements.active[config.entitlement];
  useSubscription.getState().set({
    isPro: Boolean(ent),
    expiresAt: ent?.expirationDate ?? null,
    productId: ent?.productIdentifier ?? null,
    isTrial: ent?.periodType === 'TRIAL' || ent?.periodType === 'INTRO',
    willRenew: ent?.willRenew ?? false,
  });
}

export async function initPurchases(): Promise<void> {
  if (!purchasesAvailable || configured) return;
  try {
    sdk().configure({ apiKey: apiKey as string });
    configured = true;
    sdk().addCustomerInfoUpdateListener(applyCustomerInfo);
    applyCustomerInfo(await sdk().getCustomerInfo());
  } catch {
    /* offline: keep the cached entitlement */
  }
}

export async function identifyPurchaser(userId: string): Promise<void> {
  if (!configured) return;
  try {
    const { customerInfo } = await sdk().logIn(userId);
    applyCustomerInfo(customerInfo);
  } catch {
    /* keep cache */
  }
}

export async function logOutPurchaser(): Promise<void> {
  if (!configured) return;
  try {
    await sdk().logOut();
  } catch {
    /* anonymous already */
  }
}

export interface Offers {
  plans: Plan[];
  /** True when the plans came from the store (real prices and real trial eligibility). */
  available: boolean;
}

const packages = new Map<PlanId, Package>();

/** Free-trial length from either store's product shape, or null. */
export function trialDaysOf(product: unknown): number | null {
  const p = product as {
    defaultOption?: { freePhase?: { billingPeriod?: { unit: string; value: number } } | null } | null;
    introPrice?: { price?: number; periodUnit?: string; periodNumberOfUnits?: number } | null;
  };
  const free = p.defaultOption?.freePhase?.billingPeriod;
  if (free) return periodToDays(free.unit, free.value) || null;
  const intro = p.introPrice;
  if (intro && intro.price === 0 && intro.periodUnit && intro.periodNumberOfUnits) return periodToDays(intro.periodUnit, intro.periodNumberOfUnits) || null;
  return null;
}

export function planFromPackage(id: PlanId, pkg: Package): Plan {
  const product = pkg.product;
  return {
    id,
    productId: product.identifier,
    price: product.price,
    priceString: product.priceString,
    currency: product.currencyCode,
    trialDays: trialDaysOf(product),
  };
}

export async function loadOffers(): Promise<Offers> {
  if (!configured) return { plans: fallbackPlans(), available: false };
  try {
    const offerings = await sdk().getOfferings();
    const current = offerings.current;
    const monthly = current?.monthly ?? null;
    const yearly = current?.annual ?? null;
    if (monthly || yearly) {
      packages.clear();
      const plans: Plan[] = [];
      if (monthly) (packages.set('monthly', monthly), plans.push(planFromPackage('monthly', monthly)));
      if (yearly) (packages.set('yearly', yearly), plans.push(planFromPackage('yearly', yearly)));
      return { plans: plans.sort((a, b) => (a.id === 'yearly' ? -1 : 1) - (b.id === 'yearly' ? -1 : 1)), available: true };
    }
  } catch {
    /* fall through */
  }
  return { plans: fallbackPlans(), available: false };
}

export type PurchaseResult = { ok: true } | { ok: false; cancelled?: boolean; error?: string };

export async function purchasePro(plan: PlanId): Promise<PurchaseResult> {
  if (!configured) return { ok: false, error: 'Purchases are not available on this build.' };
  try {
    if (!packages.has(plan)) await loadOffers();
    const pkg = packages.get(plan);
    if (!pkg) return { ok: false, error: 'This plan is not available right now. Try again later.' };
    const { customerInfo } = await sdk().purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return useSubscription.getState().isPro ? { ok: true } : { ok: false, error: 'Purchase could not be verified.' };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    return err.userCancelled ? { ok: false, cancelled: true } : { ok: false, error: err.message ?? 'Purchase failed.' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!configured) return { ok: false, error: 'Purchases are not available on this build.' };
  try {
    applyCustomerInfo(await sdk().restorePurchases());
    return useSubscription.getState().isPro ? { ok: true } : { ok: false, error: 'No active subscription found.' };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
