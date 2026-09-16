-- In-app feedback from the floating footer widget: a bug report or a feature
-- idea, plus who sent it (when signed in) and the page they were on.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('bug', 'feature')),
  message text not null,
  path text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback(created_at desc);

-- Writes only ever happen through the service-role server action, and nobody
-- reads it from the browser — RLS on with no policies locks it down.
alter table public.feedback enable row level security;
