alter table public.profiles
  add column open_to_coaching_outreach boolean not null default false;

-- Backfill existing rows onto the new career_stage / role_type value sets
-- so nothing is left pointing at a taxonomy value that no longer exists.
update public.profiles set career_stage = case career_stage
  when 'early' then 'early_ic'
  when 'mid' then 'mid_ic'
  when 'senior' then 'senior_ic'
  when 'director' then 'director_plus'
  else career_stage
end;

update public.profiles set role_type = case role_type
  when 'designer' then 'product_design'
  when 'design_management' then 'product_design'
  when 'pm_ic' then 'product_management'
  when 'pm_manager' then 'product_management'
  when 'content_designer' then 'content_design'
  when 'ux_researcher' then 'user_research'
  else role_type
end;
