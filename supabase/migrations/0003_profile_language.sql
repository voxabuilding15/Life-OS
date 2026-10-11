-- UI language preference, synced across devices (en, fr, ar).
alter table public.profiles
  add column if not exists language text check (language in ('en', 'fr', 'ar'));
