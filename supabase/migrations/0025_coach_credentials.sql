-- Coaching credentials (certifications, training, etc.) and years of
-- coaching experience — both optional, shown on the coach card.
alter table public.coaches
  add column if not exists credentials text,
  add column if not exists years_coaching integer;
