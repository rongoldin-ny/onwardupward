-- Temporary waitlist: new members and coaches finish onboarding, then wait to
-- be let in. Set when they finish the wizard; cleared when an admin approves
-- them (member approval, coach approval, or "Let in" from the waitlist page).
-- Existing accounts are never waitlisted.

alter table public.profiles
  add column if not exists waitlisted_at timestamptz;

-- Same privilege guard as before, plus: nobody can let themselves in.
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
  if new.role is distinct from old.role and new.role not in ('candidate', 'recruiter') then
    new.role := old.role;
  end if;
  new.is_paid := old.is_paid;
  new.vetting_status := old.vetting_status;
  new.is_supporter := old.is_supporter;
  new.archived_at := old.archived_at;
  new.waitlisted_at := old.waitlisted_at;
  return new;
end;
$$;
