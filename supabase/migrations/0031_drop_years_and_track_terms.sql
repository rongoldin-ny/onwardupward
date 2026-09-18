-- Two numbers nobody was served by. A count of years says little about
-- whether a coach suits you or what a member can do, and both aged wrong the
-- moment they were entered. Dropped rather than hidden: keeping a column we
-- no longer show is keeping data we can't justify holding.
alter table public.profiles drop column if exists years_experience;
alter table public.coaches drop column if exists years_coaching;

-- When they ticked the box on the sign-up page. Null for accounts created
-- before it existed — those people agreed to the line under the button, which
-- we can't date.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;
