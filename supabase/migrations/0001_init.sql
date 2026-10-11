-- Life OS: initial schema
-- Every table is protected by Row Level Security: a user can only ever see and change their own rows.
-- Sync columns (id, created_at, updated_at, deleted_at) are written by the app; `synced_at` is stamped
-- by the server on every write and is the cursor devices use to pull changes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.stamp_synced_at()
returns trigger language plpgsql as $$
begin
  new.synced_at := now();
  return new;
end;
$$;

-- Level derived from XP with the same curve the app uses:
-- reaching level L needs 25*n^2 + 75*n XP where n = L - 1.
create or replace function public.level_from_xp(xp integer)
returns integer language sql immutable as $$
  select floor((-75 + sqrt(5625 + 100 * greatest(xp, 0))) / 50)::integer + 1;
$$;

-- ---------------------------------------------------------------------------
-- users / profiles
-- ---------------------------------------------------------------------------

create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references public.users (id) on delete cascade,
  display_name  text not null default '',
  avatar_url    text,
  objectives    text[] not null default '{}',
  xp            integer not null default 0 check (xp >= 0),
  level         integer not null default 1,
  onboarded     boolean not null default false,
  push_token    text,
  push_platform text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.profiles_set_level()
returns trigger language plpgsql as $$
begin
  new.level := public.level_from_xp(new.xp);
  return new;
end;
$$;

create trigger profiles_level before insert or update of xp on public.profiles
  for each row execute function public.profiles_set_level();

-- Create the user + profile rows as soon as someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
    on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Synced content tables
-- ---------------------------------------------------------------------------

create table public.tasks (
  id           uuid primary key,
  user_id      uuid not null references public.users (id) on delete cascade,
  title        text not null,
  description  text not null default '',
  category     text not null default 'Personal',
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date     date,
  reminder_at  timestamptz,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks (user_id, due_date) where deleted_at is null;
create index tasks_user_synced_idx on public.tasks (user_id, synced_at);

create table public.habits (
  id            uuid primary key,
  user_id       uuid not null references public.users (id) on delete cascade,
  name          text not null,
  icon          text not null default 'book',
  reminder_time text check (reminder_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced_at     timestamptz not null default now()
);
create index habits_user_synced_idx on public.habits (user_id, synced_at);

create table public.habit_logs (
  id         uuid primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  log_date   date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);
create index habit_logs_user_synced_idx on public.habit_logs (user_id, synced_at);

create table public.goals (
  id           uuid primary key,
  user_id      uuid not null references public.users (id) on delete cascade,
  title        text not null,
  description  text not null default '',
  category     text not null default 'Personal',
  target_date  date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now()
);
create index goals_user_synced_idx on public.goals (user_id, synced_at);

create table public.goal_milestones (
  id           uuid primary key,
  user_id      uuid not null references public.users (id) on delete cascade,
  goal_id      uuid not null references public.goals (id) on delete cascade,
  title        text not null,
  position     integer not null default 0,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now()
);
create index goal_milestones_goal_idx on public.goal_milestones (goal_id, position);
create index goal_milestones_user_synced_idx on public.goal_milestones (user_id, synced_at);

create table public.notes (
  id          uuid primary key,
  user_id     uuid not null references public.users (id) on delete cascade,
  title       text not null default '',
  body        text not null default '',
  category    text not null default 'Ideas',
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);
create index notes_user_synced_idx on public.notes (user_id, synced_at);
create index notes_search_idx on public.notes using gin (to_tsvector('simple', title || ' ' || body));

create table public.journal_entries (
  id         uuid primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  entry_date date not null,
  mood       smallint not null default 3 check (mood between 1 and 5),
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index journal_user_synced_idx on public.journal_entries (user_id, synced_at);

create table public.focus_sessions (
  id               uuid primary key,
  user_id          uuid not null references public.users (id) on delete cascade,
  task_id          uuid references public.tasks (id) on delete set null,
  started_at       timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  planned_seconds  integer not null check (planned_seconds >= 0),
  completed        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  synced_at        timestamptz not null default now()
);
create index focus_user_started_idx on public.focus_sessions (user_id, started_at desc);
create index focus_user_synced_idx on public.focus_sessions (user_id, synced_at);

create table public.achievements (
  id          uuid primary key,
  user_id     uuid not null references public.users (id) on delete cascade,
  key         text not null,
  unlocked_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  unique (user_id, key)
);
create index achievements_user_synced_idx on public.achievements (user_id, synced_at);

-- Written only by the RevenueCat webhook (service role). Clients can read their own row.
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references public.users (id) on delete cascade,
  plan                    text not null default 'free' check (plan in ('free', 'pro')),
  status                  text not null default 'inactive',
  product_id              text,
  revenuecat_app_user_id  text,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

-- Server-side sync cursor on every synced table.
do $$
declare t text;
begin
  foreach t in array array['tasks','habits','habit_logs','goals','goal_milestones','notes','journal_entries','focus_sessions','achievements']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.stamp_synced_at()', t || '_synced', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users           enable row level security;
alter table public.profiles        enable row level security;
alter table public.tasks           enable row level security;
alter table public.habits          enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.goals           enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.notes           enable row level security;
alter table public.journal_entries enable row level security;
alter table public.focus_sessions  enable row level security;
alter table public.achievements    enable row level security;
alter table public.subscriptions   enable row level security;

create policy "users: read own"   on public.users for select to authenticated using (id = (select auth.uid()));
create policy "users: update own" on public.users for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "profiles: read own"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['tasks','habits','habit_logs','goals','goal_milestones','notes','journal_entries','focus_sessions','achievements']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))', t || ': read own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t || ': insert own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t || ': update own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t || ': delete own', t);
  end loop;
end $$;

-- Subscriptions are read-only for clients: only the webhook (service role, bypasses RLS) writes.
create policy "subscriptions: read own" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Account deletion (called from Settings -> Delete account)
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid(); -- cascades to every table above
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public avatar bucket, writable only inside the owner's folder
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
