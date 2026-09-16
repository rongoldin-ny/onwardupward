-- Smart coach matching results, one row per (member, coach) that Claude has
-- scored. Stored so matching runs once per coach instead of on every visit:
-- later page loads only score coaches that joined the bench since, and a
-- member's rows are re-scored only when their profile changes (profile_hash).
create table if not exists public.coach_matches (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  -- 0–100 fit score; null means scored and not a match.
  score smallint,
  -- One sentence on why the coach fits this member; null when not a match.
  reason text,
  -- Hash of the profile summary the score was computed from.
  profile_hash text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, coach_id)
);

alter table public.coach_matches enable row level security;

-- Written only through the service role on the server; members may read
-- their own.
create policy "coach_matches readable by the member" on public.coach_matches
  for select using (auth.uid() = profile_id);
