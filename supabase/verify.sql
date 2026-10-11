-- Read-only post-migration verification. Run against the production project:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/verify.sql
-- Any failed check raises an exception (non-zero exit). The auth-trigger test inserts a throw-away
-- auth user inside a transaction that is always rolled back, so nothing is left behind.

begin;

do $$
declare
  t text; n int; missing text[] := '{}';
  expected text[] := array['users','profiles','tasks','habits','habit_logs','goals','goal_milestones','notes','journal_entries','focus_sessions','achievements','subscriptions'];
begin
  -- 1. tables
  foreach t in array expected loop
    if to_regclass('public.' || t) is null then missing := missing || t; end if;
  end loop;
  if array_length(missing, 1) > 0 then raise exception 'FAIL tables missing: %', missing; end if;
  raise notice 'OK   % tables exist', array_length(expected, 1);

  -- 2. RLS enabled + at least one policy on every public table (not only ours)
  select string_agg(c.relname, ', ') into t from pg_class c join pg_namespace s on s.oid = c.relnamespace
   where s.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if t is not null then raise exception 'FAIL RLS disabled on: %', t; end if;
  select string_agg(c.relname, ', ') into t from pg_class c join pg_namespace s on s.oid = c.relnamespace
   where s.nspname = 'public' and c.relkind = 'r'
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname);
  if t is not null then raise exception 'FAIL RLS enabled but no policy on: %', t; end if;
  raise notice 'OK   RLS enabled with policies on every public table';

  -- 3. anon must not be able to read user data
  foreach t in array expected loop
    if has_table_privilege('anon', 'public.' || t, 'SELECT') and exists (select 1 from pg_policies p where p.tablename = t and p.schemaname = 'public' and ('anon' = any (p.roles) or 'public' = any (p.roles))) then
      raise warning 'CHECK anon has SELECT privilege and a policy applying to anon/public on %', t;
    end if;
  end loop;

  -- 4. storage bucket
  select count(*) into n from storage.buckets where id = 'avatars';
  if n <> 1 then raise exception 'FAIL storage bucket "avatars" missing'; end if;
  select count(*) into n from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars:%';
  if n < 4 then raise exception 'FAIL expected 4 avatars storage policies, found %', n; end if;
  raise notice 'OK   storage bucket avatars + % policies', n;

  -- 5. functions / triggers
  if not exists (select 1 from pg_trigger tg join pg_class c on c.oid = tg.tgrelid join pg_namespace s on s.oid = c.relnamespace
                  where s.nspname = 'auth' and c.relname = 'users' and tg.tgname = 'on_auth_user_created' and not tg.tgisinternal)
    then raise exception 'FAIL trigger on_auth_user_created missing on auth.users'; end if;
  if to_regprocedure('public.delete_my_account()') is null then raise exception 'FAIL function delete_my_account() missing'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='language') then raise exception 'FAIL profiles.language missing (0003)'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='subscriptions' and column_name='period_type') then raise exception 'FAIL subscriptions.period_type missing (0002)'; end if;
  raise notice 'OK   triggers, delete_my_account(), 0002 + 0003 columns';

  -- 6. auth trigger behaviour: a new auth user gets a public.users row and a profile
  perform set_config('lifeos.test_id', gen_random_uuid()::text, true);
  insert into auth.users (id, email, raw_user_meta_data)
    values (current_setting('lifeos.test_id')::uuid, 'verify-' || current_setting('lifeos.test_id') || '@example.invalid', '{"display_name":"Verify"}');
  if not exists (select 1 from public.users where id = current_setting('lifeos.test_id')::uuid) then raise exception 'FAIL auth trigger did not create public.users row'; end if;
  if not exists (select 1 from public.profiles where id = current_setting('lifeos.test_id')::uuid and display_name = 'Verify') then raise exception 'FAIL auth trigger did not create profile'; end if;
  raise notice 'OK   signing up creates users + profiles rows (rolled back)';
end $$;

rollback;
