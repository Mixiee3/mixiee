-- Create a simpler approach: store each section as editable HTML
drop table if exists public.editable_sections cascade;

create table public.editable_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  section_title text not null,
  section_order int not null,
  html_content text not null,
  is_published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.editable_sections enable row level security;

-- Anyone can read published sections  
create policy "editable_sections_select_published"
  on public.editable_sections for select
  using (is_published = true);

-- Only admin users can update
create policy "editable_sections_update_admin"
  on public.editable_sections for update
  using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid()
    )
  );

-- Trigger for timestamps
create trigger editable_sections_updated_at
  before update on public.editable_sections
  for each row
  execute function public.update_cheatsheet_timestamp();
