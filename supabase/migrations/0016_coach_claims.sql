-- "This you? Claim your slot" — a signed-in member requesting an unclaimed
-- coach listing. Kept separate from `coaches.profile_id` so a claim needs
-- admin review before it actually takes over the listing.
create table if not exists public.coach_claims (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_claims_coach_id_idx on public.coach_claims(coach_id);
create index if not exists coach_claims_profile_id_idx on public.coach_claims(profile_id);
create index if not exists coach_claims_status_idx on public.coach_claims(status);

-- Locked down: claims carry who's requesting what, so only service-role
-- actions (claimCoach, approveClaim, rejectClaim) touch this table.
alter table public.coach_claims enable row level security;

create trigger coach_claims_set_updated_at
  before update on public.coach_claims
  for each row execute function public.set_updated_at();
