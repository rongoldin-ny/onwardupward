-- Finer-grained than `disciplines` (design/product/both): which of the
-- platform's own role types (lib/taxonomy.ts ROLE_TYPES) a coach actually
-- specializes in coaching, so it can be shown on the coach detail page.
alter table public.coaches
  add column if not exists specialties text[] not null default '{}';
