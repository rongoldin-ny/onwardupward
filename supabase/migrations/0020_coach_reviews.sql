-- Member-written reviews of a coach: what they got help with, the outcome,
-- and freeform notes. One review per (coach, reviewer) — writing again
-- edits the existing one rather than piling up duplicates.
create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  helped_with text not null,
  outcome text not null,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, reviewer_id)
);

create index if not exists coach_reviews_coach_id_idx on public.coach_reviews(coach_id);

alter table public.coach_reviews enable row level security;

-- Reviews are public testimonial content, same visibility as the coach card
-- itself — writes only ever happen through service-role server actions.
create policy "coach_reviews readable by everyone" on public.coach_reviews
  for select using (true);

create trigger coach_reviews_set_updated_at
  before update on public.coach_reviews
  for each row execute function public.set_updated_at();
