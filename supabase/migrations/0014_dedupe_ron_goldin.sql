-- One-time cleanup: the curated seed's "ron-goldin" coach row (profile_id
-- null, added by scripts/seed-coaches.ts before Ron had a real account) can
-- duplicate the coach row his own account creates via the "Start coaching"
-- flow (app/actions/coaches.ts saveCoachAttributes), which is keyed on
-- profile_id rather than slug. That second row has the real player card
-- (it's tied to his actual profile) but may have a bare coach card if he
-- never filled the coaching form in. This merges the seed row's richer
-- content into the profile-linked row, then removes the seed row.
--
-- Written defensively so it's safe to run more than once and safe if the
-- live data doesn't match this exact shape — it only acts where both rows
-- exist as described, and otherwise just relinks rather than deletes.
do $$
declare
  ron_profile_id uuid;
  keeper_id uuid;
  dupe_id uuid;
begin
  select id into ron_profile_id from public.profiles where lower(email) = 'r@rongoldin.com';
  select id into dupe_id from public.coaches where slug = 'ron-goldin';

  if ron_profile_id is null or dupe_id is null then
    raise notice 'Ron Goldin dedup: nothing to do (profile_id=%, seed row=%)', ron_profile_id, dupe_id;
    return;
  end if;

  select id into keeper_id from public.coaches
    where profile_id = ron_profile_id and id <> dupe_id;

  if keeper_id is null then
    -- No separate profile-linked row exists — link the seed row to Ron's
    -- real profile instead of deleting it, so future edits update it in
    -- place and no duplicate can appear later.
    update public.coaches set profile_id = ron_profile_id where id = dupe_id;
    raise notice 'Ron Goldin dedup: no second row found — linked the seed row % to the profile instead.', dupe_id;
    return;
  end if;

  update public.coaches k
  set
    short_description = coalesce(nullif(k.short_description, ''), d.short_description),
    offering = coalesce(nullif(k.offering, ''), d.offering),
    best_for = coalesce(nullif(k.best_for, ''), d.best_for),
    booking_url = coalesce(nullif(k.booking_url, ''), d.booking_url),
    company = coalesce(nullif(k.company, ''), d.company),
    pricing = coalesce(nullif(k.pricing, ''), d.pricing),
    photo_url = coalesce(nullif(k.photo_url, ''), d.photo_url),
    website = coalesce(nullif(k.website, ''), d.website),
    substack_url = coalesce(nullif(k.substack_url, ''), d.substack_url, 'https://rongoldin.substack.com'),
    disciplines = coalesce(k.disciplines, d.disciplines, 'both'),
    -- The seed row was live ("approved"); don't let the merge silently
    -- un-publish Ron's listing if the profile-linked row was still a draft.
    status = case when d.status = 'approved' then 'approved' else k.status end
  from public.coaches d
  where k.id = keeper_id and d.id = dupe_id;

  delete from public.coaches where id = dupe_id;
  raise notice 'Ron Goldin dedup: merged seed row % into profile-linked row % and deleted the seed row.', dupe_id, keeper_id;
end $$;
