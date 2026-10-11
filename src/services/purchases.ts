import { Platform } from 'react-native';
import { config } from '@/lib/config';
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

export interface ProOffer {
  priceLabel: string;
  available: boolean;
}

export async function loadOffer(): Promise<ProOffer> {
  if (!configured) return { priceLabel: `${config.proPriceLabel}/month`, available: false };
  try {
    const offerings = await sdk().getOfferings();
    const pkg = offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
    cachedPackage = pkg;
    if (pkg) return { priceLabel: `${pkg.product.priceString}/month`, available: true };
  } catch {
    /* fall through */
  }
  return { priceLabel: `${config.proPriceLabel}/month`, available: false };
}

export type PurchaseResult = { ok: true } | { ok: false; cancelled?: boolean; error?: string };

export async function purchasePro(): Promise<PurchaseResult> {
  if (!configured) return { ok: false, error: 'Purchases are not available on this build.' };
  try {
    if (!cachedPackage) await loadOffer();
    if (!cachedPackage) return { ok: false, error: 'Pro is not available right now. Try again later.' };
    const { customerInfo } = await sdk().purchasePackage(cachedPackage);
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
