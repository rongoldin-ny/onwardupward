-- "Allow coaches to contact me" — the permission open_to_coaching_outreach
-- always described, renamed to match the setting members actually see.
--
-- Defaulted on: nothing ever read the old column, so nobody's listing or
-- profile behaved differently for having it unticked, and a network you can't
-- be reached through isn't much of a network. Anyone who'd rather not hear
-- from coaches turns it off in Settings → Notifications.
alter table public.profiles rename column open_to_coaching_outreach to allow_coach_contact;
alter table public.profiles alter column allow_coach_contact set default true;
update public.profiles set allow_coach_contact = true;
