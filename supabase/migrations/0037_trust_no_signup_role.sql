-- auth.users.raw_user_meta_data is whatever the client sent to /auth/v1/signup,
-- and the anon key is public, so a role read from it let anyone register as an
-- admin or a coach. Every account now starts as the column default; /role and
-- the admin client are the only ways to change it. Name and photo stay: they
-- seed fields people can edit on their own profile anyway, and a password
-- sign-up passes its name the same way Google does.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, photo_url)
  values (
    new.id,
    new.email,
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
