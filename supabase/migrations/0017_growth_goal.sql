-- "Where I hope to grow" — what a member wants a coach's help with. Doubles
-- as the strongest signal for coach-match scoring (lib/coach-match.ts).
alter table public.profiles
  add column if not exists growth_goal text;
