-- Sign-up is Google OAuth only now, so every new auth.users row arrives with
-- Google's profile claims in raw_user_meta_data. Seed name and photo from
-- them so onboarding opens pre-filled instead of blank. Google sends
-- full_name/avatar_url; name/picture are the raw OIDC claim names, kept as a
-- fallback in case the provider payload shape shifts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    nullif(coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ), ''),
    nullif(coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ), '')
  );
  return new;
end;
$$;
