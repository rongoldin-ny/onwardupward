-- Admin review needs an explicit "rejected" outcome, not just silence.
alter table public.profiles drop constraint if exists profiles_vetting_status_check;
alter table public.profiles
  add constraint profiles_vetting_status_check
  check (vetting_status in ('pending', 'approved', 'rejected'));

alter table public.coaches drop constraint if exists coaches_status_check;
alter table public.coaches
  add constraint coaches_status_check
  check (status in ('draft', 'unclaimed', 'pending', 'approved', 'rejected'));
