-- Résumés are private by default — uploaded only to power AI summaries and
-- matching. A member can opt in to showing it on their public profile.
alter table public.profiles
  add column if not exists resume_public boolean not null default false;
