-- O&U Supabase schema: profiles (linked to auth.users), work history,
-- references, messages, company signals, analytics, recruiter profiles.
-- Row Level Security throughout; see PRD §4.8 for the original intent.
--
-- Safe to re-run from scratch: tears down anything from a previous partial
-- run before recreating. No production data exists yet at this stage.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists auth_users_sync_last_sign_in on auth.users;
drop table if exists public.recruiter_profiles cascade;
drop table if exists public.analytics_events cascade;
drop table if exists public.company_signals cascade;
drop table if exists public.messages cascade;
drop table if exists public.refs cascade;
drop table if exists public.work_history cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.sync_last_sign_in() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.protect_privileged_profile_fields() cascade;
drop function if exists public.is_paid_recruiter() cascade;
drop function if exists public.is_admin() cascade;
-- Note: the storage bucket is created idempotently below (insert ... on
-- conflict do nothing) and never torn down here — Supabase blocks direct
-- deletes from storage tables, and there's nothing to clean up on first run.

create extension if not exists pgcrypto;

-- ============================================================== PROFILES --
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'candidate' check (role in ('candidate','recruiter','coach','admin')),
  name text,
  email text,
  photo_url text,
  linkedin_url text,
  location_country text,
  location_state text,
  location_city text,
  role_type text,
  career_stage text,
  bio text,
  ai_bio text,
  dream_job text,
  last_role_text text,
  brags jsonb not null default '[]'::jsonb,
  portfolio_url text,
  portfolio_password text, -- plain text for MVP; TODO: hash in production
  portfolio_images jsonb not null default '[]'::jsonb, -- [{url,company,caption,year}]
  years_experience integer,
  industries jsonb not null default '[]'::jsonb,
  contact_preference text not null default 'email' check (contact_preference in ('email','linkedin')),
  is_paid boolean not null default false,
  onboarding_complete boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  company text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.refs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  full_name text,
  current_title text,
  linkedin_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.company_signals (
  company_name text primary key,
  tags jsonb not null default '[]'::jsonb,
  last_updated timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('profile_view','element_click','search_query','message_sent')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.recruiter_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  company_names jsonb not null default '[]'::jsonb,
  target_role_types jsonb not null default '[]'::jsonb,
  target_career_stages jsonb not null default '[]'::jsonb
);

create index work_history_candidate_idx on public.work_history(candidate_id);
create index refs_candidate_idx on public.refs(candidate_id);
create index messages_recipient_idx on public.messages(recipient_id);
create index messages_sender_idx on public.messages(sender_id);
create index analytics_target_idx on public.analytics_events(target_profile_id);
create index analytics_user_idx on public.analytics_events(user_id);
create index analytics_type_created_idx on public.analytics_events(event_type, created_at);
create index profiles_role_idx on public.profiles(role);

-- ============================================================ FUNCTIONS --

-- Create a profile row automatically whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'candidate'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep last_sign_in_at mirrored onto profiles so the admin view can read it
-- under normal RLS instead of needing a service-role admin API call.
create function public.sync_last_sign_in()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles set last_sign_in_at = new.last_sign_in_at where id = new.id;
  end if;
  return new;
end;
$$;

create trigger auth_users_sync_last_sign_in
  after update on auth.users
  for each row execute function public.sync_last_sign_in();

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- A regular user must never be able to grant themselves is_paid or admin
-- role through a direct profile update (RLS controls *which rows*, not
-- *which columns* — this trigger closes that gap). Service-role calls and
-- admins are exempt, since Stripe-webhook and admin-panel writes need it.
-- Self-service switching between candidate/recruiter IS allowed — that's
-- the role-select step during onboarding, not an escalation.
create function public.protect_privileged_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.role() = 'service_role' or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    return new;
  end if;
  if new.role is distinct from old.role and new.role not in ('candidate', 'recruiter') then
    new.role := old.role;
  end if;
  new.is_paid := old.is_paid;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();

-- Security-definer helpers so RLS policies can check role/is_paid without
-- recursively re-triggering RLS on profiles.
create function public.is_paid_recruiter()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'recruiter' and is_paid = true
  );
$$;

create function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- =================================================================== RLS --
alter table public.profiles enable row level security;
alter table public.work_history enable row level security;
alter table public.refs enable row level security;
alter table public.messages enable row level security;
alter table public.company_signals enable row level security;
alter table public.analytics_events enable row level security;
alter table public.recruiter_profiles enable row level security;

create policy "self select" on public.profiles for select using (auth.uid() = id);
create policy "self update" on public.profiles for update using (auth.uid() = id);
create policy "paid recruiters view candidates" on public.profiles for select
  using (role = 'candidate' and public.is_paid_recruiter());
create policy "admins view all profiles" on public.profiles for select using (public.is_admin());

create policy "owner manages work history" on public.work_history for all
  using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "recruiters view candidate work history" on public.work_history for select
  using (public.is_paid_recruiter() or public.is_admin());

create policy "owner manages references" on public.refs for all
  using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "recruiters view candidate references" on public.refs for select
  using (public.is_paid_recruiter() or public.is_admin());

create policy "recruiter sends message" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_paid_recruiter());
create policy "participants view their messages" on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

create policy "admins view company signals" on public.company_signals for select
  using (public.is_admin());

create policy "log own events" on public.analytics_events for insert
  with check (user_id = auth.uid());
create policy "view own event stats" on public.analytics_events for select
  using (target_profile_id = auth.uid() or user_id = auth.uid() or public.is_admin());

create policy "owner manages recruiter profile" on public.recruiter_profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admins view recruiter profiles" on public.recruiter_profiles for select
  using (public.is_admin());

-- Storage: the 'profile-assets' bucket and its access rules are provisioned
-- from scripts/supabase-setup.ts via the Storage API, because Supabase blocks
-- direct SQL on storage tables. Uploads run through authenticated server
-- actions using the service role, so no object-level RLS policies are needed;
-- the bucket is public-read so images render.
