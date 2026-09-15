-- Google-only sign-in made /signin and /signup the same button, so the OAuth
-- callback has to decide on its own whether someone still needs to pick a
-- role. It was using onboarding_complete, which sent anyone who abandoned the
-- wizard back to the role picker on every sign-in. `role` can't answer the
-- question either — it defaults to 'candidate', so a fresh account is
-- indistinguishable from someone who deliberately chose candidate.
alter table public.profiles
  add column if not exists role_chosen boolean not null default false;

-- Every existing account predates Google-only signup and has already been
-- through the picker; only accounts created from here on start unchosen.
update public.profiles set role_chosen = true;
