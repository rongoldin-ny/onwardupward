-- AI superpowers: [{skill, xp: basic|fluent|expert}] on candidate profiles.
alter table public.profiles
  add column if not exists ai_superpowers jsonb not null default '[]'::jsonb;
