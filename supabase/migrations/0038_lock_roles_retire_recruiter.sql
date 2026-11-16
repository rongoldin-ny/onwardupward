-- Two holes in the privilege guard, and the recruiter role retired.
--
-- 1. Anyone could make themselves a recruiter. The guard let a user move
--    their own role between 'candidate' and 'recruiter' (a leftover from the
--    jobs-marketplace onboarding), and recruiters are never waitlisted. Every
--    real role change now goes through the admin client (/role, claims,
--    approvals), so users can't change their own role at all.
-- 2. Anyone could skip the waitlist. onboarding_complete and role_chosen
--    weren't guarded, so a user could PATCH onboarding_complete = true with
--    the public anon key and use the app without ever finishing the wizard
--    (which is what puts them on the waitlist). Both are guarded now; the
--    wizard writes them with the admin client.
--
-- The recruiter role is gone for now: existing recruiter accounts become
-- unfinished member accounts, so their next sign-in goes through the role
-- picker, the wizard and the waitlist like anyone else. Their old search
-- preferences (recruiter_profiles) and any sent messages are left in place.

-- Recruiter accounts → members who haven't signed up yet. The guard would
-- revert these columns for a non-service caller, so it's off for this update.
alter table public.profiles disable trigger profiles_protect_privileged_fields;
update public.profiles
   set role = 'candidate',
       is_paid = false,
       role_chosen = false,
       onboarding_complete = false
 where role = 'recruiter';
alter table public.profiles enable trigger profiles_protect_privileged_fields;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('candidate', 'coach', 'admin'));

-- What recruiters could read and send.
drop policy if exists "paid recruiters view candidates" on public.profiles;
drop policy if exists "recruiters view candidate work history" on public.work_history;
drop policy if exists "recruiters view candidate references" on public.refs;
drop policy if exists "recruiter sends message" on public.messages;
drop function if exists public.is_paid_recruiter();

-- Admins still see work history and references through their own policies.
create policy "admins view work history" on public.work_history for select
  using (public.is_admin());
create policy "admins view references" on public.refs for select
  using (public.is_admin());

-- Same privilege guard as before, plus: no self-serve role changes, and
-- nobody can mark their own sign-up finished.
create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.role() = 'service_role' or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    return new;
  end if;
  new.role := old.role;
  new.role_chosen := old.role_chosen;
  new.onboarding_complete := old.onboarding_complete;
  new.is_paid := old.is_paid;
  new.vetting_status := old.vetting_status;
  new.is_supporter := old.is_supporter;
  new.archived_at := old.archived_at;
  new.waitlisted_at := old.waitlisted_at;
  return new;
end;
$$;
