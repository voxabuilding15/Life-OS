-- Free trials: remember whether the current period is a trial (RevenueCat period_type).
alter table public.subscriptions
  add column if not exists period_type text check (period_type in ('TRIAL', 'INTRO', 'NORMAL')),
  add column if not exists product_plan text generated always as (
    case when product_id ilike '%yearly%' or product_id ilike '%annual%' then 'yearly'
         when product_id is not null then 'monthly' end
  ) stored;
