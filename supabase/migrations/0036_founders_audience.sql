-- "Startup founder" is no longer a coaching specialty: founders are now an
-- audience a coach takes on (target_mentees 'Founders'). Move anyone who had
-- picked the specialty over, so their card keeps saying it.

update public.coaches
set
  target_mentees = case
    when 'Founders' = any(target_mentees) then target_mentees
    else array_append(target_mentees, 'Founders')
  end,
  specialties = array_remove(specialties, 'founder_coaching')
where 'founder_coaching' = any(specialties);
