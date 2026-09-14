-- Coaching cards autosave as a draft; "Submit for review" moves them to pending.
alter table public.coaches drop constraint if exists coaches_status_check;
alter table public.coaches
  add constraint coaches_status_check
  check (status in ('draft', 'unclaimed', 'pending', 'approved'));
