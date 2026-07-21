-- Résumé upload: stored in profile-assets, referenced from the profile.
alter table public.profiles add column if not exists resume_url text;
