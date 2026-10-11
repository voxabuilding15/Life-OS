// Supabase Edge Function: RevenueCat -> public.subscriptions
// Deploy:  supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secrets: supabase secrets set REVENUECAT_WEBHOOK_AUTH="<same value as the Authorization header configured in RevenueCat>"
// RevenueCat: Project -> Integrations -> Webhooks -> URL = https://<project>.functions.supabase.co/revenuecat-webhook
//
// The app user id sent to RevenueCat is the Supabase user id (see identifyPurchaser in the app).
import { createClient } from 'npm:@supabase/supabase-js@2';

const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE']);
const ENDED = new Set(['EXPIRATION']);

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== Deno.env.get('REVENUECAT_WEBHOOK_AUTH')) {
    return new Response('unauthorized', { status: 401 });
  }
  const { event } = await req.json();
  const userId: string | undefined = event?.app_user_id;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return new Response('ignored', { status: 200 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const type: string = event.type;
  const expires = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  let plan: 'pro' | 'free' | null = null;
  let status = type.toLowerCase();
  if (ACTIVE.has(type)) { plan = 'pro'; status = event.period_type === 'TRIAL' ? 'trialing' : 'active'; }
  else if (ENDED.has(type)) { plan = 'free'; status = 'expired'; }
  else if (type === 'CANCELLATION') { plan = 'pro'; status = 'cancelled'; } // access continues until expiry
  else if (type === 'BILLING_ISSUE') { plan = 'pro'; status = 'billing_issue'; }
  if (!plan) return new Response('ignored', { status: 200 });

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      status,
      product_id: event.product_id ?? null,
      period_type: event.period_type ?? null, // TRIAL | INTRO | NORMAL
      revenuecat_app_user_id: userId,
      current_period_end: expires,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  return new Response(error ? error.message : 'ok', { status: error ? 500 : 200 });
});
