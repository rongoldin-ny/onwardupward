-- Two answers the free-text pricing box kept getting in prose: whether the
-- first call is free, and whether the number comes later. Booleans, so the
-- directory can filter on them and a member can see them at a glance.
alter table public.coaches
  add column if not exists free_intro_call boolean not null default false,
  add column if not exists pricing_on_call boolean not null default false;
