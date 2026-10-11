/** RevenueCat integration logic against a mocked SDK (real store purchases need a device + license tester). */
const mockSdk = {
  configure: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
};
jest.mock('react-native-purchases', () => ({ __esModule: true, default: mockSdk }));

const info = (active: boolean, extra: object = {}) => ({
  entitlements: { active: active ? { pro: { productIdentifier: 'lifeos_pro_yearly', expirationDate: '2027-01-01T00:00:00Z', periodType: 'TRIAL', willRenew: true, ...extra } } : {} },
});
const pkg = (id: string, price: number, priceString: string, extra: object = {}) => ({ identifier: id, product: { identifier: `lifeos_pro_${id}`, price, priceString, currencyCode: 'USD', ...extra } });

let purchases: typeof import('@/services/purchases');
let sub: typeof import('@/store/subscription');

beforeAll(() => {
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'test_ios';
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'test_android';
  jest.isolateModules(() => {
    purchases = require('@/services/purchases');
    sub = require('@/store/subscription');
  });
});

beforeEach(() => {
  Object.values(mockSdk).forEach((f) => f.mockReset());
  mockSdk.getCustomerInfo.mockResolvedValue(info(false));
  mockSdk.getOfferings.mockResolvedValue({
    current: {
      monthly: pkg('monthly', 4.99, '$4.99'),
      annual: pkg('yearly', 29.99, '$29.99', { defaultOption: { freePhase: { billingPeriod: { unit: 'DAY', value: 7 } } } }),
    },
  });
  sub.useSubscription.getState().reset();
});

describe('trial detection', () => {
  it('reads Google Play free phases and App Store intro prices', () => {
    expect(purchases.trialDaysOf({ defaultOption: { freePhase: { billingPeriod: { unit: 'WEEK', value: 1 } } } })).toBe(7);
    expect(purchases.trialDaysOf({ introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7 } })).toBe(7);
    expect(purchases.trialDaysOf({ introPrice: { price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 } })).toBeNull();
    expect(purchases.trialDaysOf({})).toBeNull();
  });
});

describe('purchases', () => {
  it('configures once and mirrors the entitlement', async () => {
    mockSdk.getCustomerInfo.mockResolvedValue(info(true));
    await purchases.initPurchases();
    await purchases.initPurchases();
    expect(mockSdk.configure).toHaveBeenCalledTimes(1);
    expect(sub.useSubscription.getState()).toMatchObject({ isPro: true, isTrial: true, willRenew: true, productId: 'lifeos_pro_yearly' });
  });

  it('loads both plans from the store with real trial eligibility, yearly first', async () => {
    await purchases.initPurchases();
    const { plans, available } = await purchases.loadOffers();
    expect(available).toBe(true);
    expect(plans.map((p) => p.id)).toEqual(['yearly', 'monthly']);
    expect(plans[0]).toMatchObject({ priceString: '$29.99', trialDays: 7 });
    expect(plans[1].trialDays).toBeNull();
  });

  it('falls back to configured prices when offerings fail', async () => {
    await purchases.initPurchases();
    mockSdk.getOfferings.mockRejectedValue(new Error('offline'));
    const { plans, available } = await purchases.loadOffers();
    expect(available).toBe(false);
    expect(plans).toHaveLength(2);
  });

  it('purchases the selected plan and unlocks Pro', async () => {
    await purchases.initPurchases();
    mockSdk.purchasePackage.mockResolvedValue({ customerInfo: info(true) });
    expect(await purchases.purchasePro('yearly')).toEqual({ ok: true });
    expect(mockSdk.purchasePackage.mock.calls[0][0].identifier).toBe('yearly');
    expect(sub.useSubscription.getState().isPro).toBe(true);
  });

  it('treats cancel as a non-error and surfaces real failures', async () => {
    await purchases.initPurchases();
    mockSdk.purchasePackage.mockRejectedValueOnce({ userCancelled: true });
    expect(await purchases.purchasePro('monthly')).toEqual({ ok: false, cancelled: true });
    mockSdk.purchasePackage.mockRejectedValueOnce(new Error('Payment declined'));
    expect(await purchases.purchasePro('monthly')).toEqual({ ok: false, error: 'Payment declined' });
    expect(sub.useSubscription.getState().isPro).toBe(false);
  });

  it('does not unlock Pro if the entitlement is missing after purchase', async () => {
    await purchases.initPurchases();
    mockSdk.purchasePackage.mockResolvedValue({ customerInfo: info(false) });
    expect((await purchases.purchasePro('monthly')).ok).toBe(false);
  });

  it('restores purchases', async () => {
    await purchases.initPurchases();
    mockSdk.restorePurchases.mockResolvedValue(info(false));
    expect(await purchases.restorePurchases()).toEqual({ ok: false, error: 'No active subscription found.' });
    mockSdk.restorePurchases.mockResolvedValue(info(true, { periodType: 'NORMAL' }));
    expect(await purchases.restorePurchases()).toEqual({ ok: true });
    expect(sub.useSubscription.getState().isTrial).toBe(false);
  });

  it('identifies the Supabase user so entitlements follow the account', async () => {
    await purchases.initPurchases();
    mockSdk.logIn.mockResolvedValue({ customerInfo: info(true) });
    await purchases.identifyPurchaser('user-123');
    expect(mockSdk.logIn).toHaveBeenCalledWith('user-123');
    expect(sub.useSubscription.getState().isPro).toBe(true);
  });
});
