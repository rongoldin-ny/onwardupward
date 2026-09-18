-- What a coach is, rather than what they coach. Multi-select: mentoring
-- alongside coaching is common, and so is holding an institute designation
-- next to an ICF credential. `certification_other` carries the name of
-- whatever "Other" stands for.
alter table public.coaches
  add column if not exists certifications text[] not null default '{}',
  add column if not exists certification_other text;
