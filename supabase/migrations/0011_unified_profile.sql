alter table public.profiles add column website_url text;

-- Coaches' identity now lives on profiles. Fill blanks from their listing
-- so nobody's left panel is empty after the redesign.
update public.profiles p set
  name        = coalesce(p.name, c.full_name),
  photo_url   = coalesce(p.photo_url, c.photo_url),
  bio         = coalesce(p.bio, c.short_description),
  website_url = coalesce(p.website_url, c.website)
from public.coaches c
where c.profile_id = p.id;
