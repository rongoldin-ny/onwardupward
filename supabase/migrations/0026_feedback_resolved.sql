-- Lets the admin feedback tab mark a submission as handled.
alter table public.feedback
  add column if not exists resolved boolean not null default false;
