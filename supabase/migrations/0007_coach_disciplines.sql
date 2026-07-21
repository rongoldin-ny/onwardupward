-- "What disciplines do you coach for?" — design, product, or both.
alter table public.coaches
  add column if not exists disciplines text check (disciplines in ('design', 'product', 'both'));

-- Curated/existing coaches without an answer default to both.
update public.coaches set disciplines = 'both' where disciplines is null;
