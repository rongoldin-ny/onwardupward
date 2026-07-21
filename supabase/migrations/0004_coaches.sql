-- Coaches become real data: a coaches table (curated unclaimed listings,
-- member hybrids, and standalone coach applicants), plus new analytics
-- event types for traffic and coach tracking.

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  slug text unique,
  full_name text not null,
  email text,
  short_description text,
  offering text,
  target_mentees text[] not null default '{}',
  best_for text,
  photo_url text,
  booking_url text,
  website text,
  company text,
  pricing text,
  source text,
  status text not null default 'pending' check (status in ('unclaimed', 'pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coaches enable row level security;

-- Signed-in members can browse; all writes go through service-role actions.
create policy "coaches readable by members" on public.coaches
  for select using (auth.role() = 'authenticated');

create trigger coaches_set_updated_at
  before update on public.coaches
  for each row execute function public.set_updated_at();

-- Analytics: allow page_view and coach_view events.
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.analytics_events'::regclass and contype = 'c';
  if c is not null then
    execute format('alter table public.analytics_events drop constraint %I', c);
  end if;
end $$;

alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('profile_view', 'element_click', 'search_query', 'message_sent', 'page_view', 'coach_view'));
