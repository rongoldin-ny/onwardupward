-- Notification preferences + the Supporter tier ($4.99/mo).

alter table public.profiles
  add column if not exists notification_prefs jsonb not null
    default '{"messages": true, "weekly_digest": true, "product_updates": true}'::jsonb,
  add column if not exists is_supporter boolean not null default false;

-- Members must not be able to grant themselves Supporter status directly.
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
  return new;
end;
$$;
