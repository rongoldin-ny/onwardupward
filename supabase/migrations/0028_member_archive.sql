-- Admins can remove (archive) a member without deleting anything: archived
-- profiles drop out of the Members directory, vetting queue, recruiter search,
-- public share links, the coach directory and all email sends. Clearing the
-- column restores them.

alter table public.profiles
  add column if not exists archived_at timestamptz;

-- Same privilege guard as before, plus: members can't un-archive themselves.
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
  return new;
end;
$$;
