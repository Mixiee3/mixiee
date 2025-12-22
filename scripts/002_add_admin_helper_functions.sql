-- Function to check if a user is an admin
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users
    where id = user_id
  );
end;
$$ language plpgsql security definer;

-- Policy to allow admins to update content (more restrictive)
drop policy if exists "content_sections_update_auth" on public.content_sections;
create policy "content_sections_update_admin"
  on public.content_sections for update
  using (public.is_admin(auth.uid()));

-- Function to add an admin user (can be called manually or through an API)
create or replace function public.add_admin(user_email text)
returns void as $$
declare
  user_record record;
begin
  -- Find user by email
  select id into user_record from auth.users where email = user_email;
  
  if not found then
    raise exception 'User with email % not found', user_email;
  end if;
  
  -- Insert into admin_users
  insert into public.admin_users (id, email)
  values (user_record.id, user_email)
  on conflict (id) do nothing;
end;
$$ language plpgsql security definer;

-- Example: To add an admin, run this in Supabase SQL editor or via script:
-- select public.add_admin('your-email@example.com');
