-- "What disciplines do you coach for?" (design / product / both) asked the
-- same thing as "What do you specialize in coaching?", one coarsely and one
-- precisely. The coarse answer folds into the precise one before the column
-- goes, so no listing loses its place in the directory's filters.
update public.coaches
   set specialties = array(
     select distinct unnest(
       specialties || case disciplines
         when 'design' then array['product_design']
         when 'product' then array['product_management']
         when 'both' then array['product_design', 'product_management']
         else array[]::text[]
       end
     )
   );

alter table public.coaches drop column if exists disciplines;

-- "Other" on the formats picker, and the name it stands for.
alter table public.coaches
  add column if not exists format_other text;
