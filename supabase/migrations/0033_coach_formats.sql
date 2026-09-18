-- How they work with people. Guessed from the offering text until now, which
-- meant a listing could claim a format its owner never offered and had no way
-- to take back. An empty array on an owned listing means "not said yet".
alter table public.coaches
  add column if not exists formats text[] not null default '{}';
