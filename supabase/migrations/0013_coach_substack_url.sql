-- A coach's newsletter (Substack or otherwise), surfaced as an RSS source on
-- the home "Reads" feed instead of being hardcoded in lib/mentorship-posts.ts.
alter table public.coaches
  add column if not exists substack_url text;
