-- A custom headline for the coach card (e.g. "Product & Design Leadership
-- Coach"), overriding the auto-derived "<company> · <discipline label>"
-- line when set.
alter table public.coaches
  add column if not exists title text;
