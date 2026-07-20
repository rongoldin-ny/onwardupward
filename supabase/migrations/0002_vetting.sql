-- Member vetting: new candidates start 'pending' and stay invisible to
-- search / public links until an admin approves them. Existing members are
-- grandfathered in as approved.

alter table public.profiles
  add column if not exists vetting_status text not null default 'pending'
  check (vetting_status in ('pending', 'approved'));

update public.profiles set vetting_status = 'approved';

-- Extend the privilege guard so members can't approve themselves.
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
  return new;
end;
$$;
