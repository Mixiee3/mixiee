-- Create table to store editable content sections
create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text not null,
  content jsonb not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.content_sections enable row level security;

-- Allow anyone to read content (public website)
create policy "content_sections_select_all"
  on public.content_sections for select
  using (true);

-- Only authenticated users can update
create policy "content_sections_update_auth"
  on public.content_sections for update
  using (auth.uid() is not null);

-- Create admin users table
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamp with time zone default now()
);

alter table public.admin_users enable row level security;

-- Only admins can read admin list
create policy "admin_users_select_self"
  on public.admin_users for select
  using (auth.uid() = id);

-- Insert initial content sections
insert into public.content_sections (section_key, title, content) values
  ('header', 'Header', '{"version": "v3", "subtitle": "OFFICIAL INTERNAL DOCUMENTATION"}'::jsonb),
  ('ticket_handling', 'Ticket Handling', '{
    "no_response": {
      "title": "No response from user:",
      "items": [
        "If a user hasn''t replied within 12+ hours, ping them.",
        "If there is still no reply after 4 more hours, ping one final time.",
        "If there is still no answer after 4 more hours, proceed to close the ticket.",
        "If the ticket seems handled, you can issue a /requestclose through chat, and usually members tend to not respond to it, if you do not get a response within 6 hours you can ping them again, and if they don''t respond in another 6-8 hours you can close the ticket.",
        "Closing the ticket automatically gives a reason saying the ticket was handled, so you don''t need to give a reason.",
        "If a ticket seems like an issue that isn''t related to technical support, you can use /ticket transfer (the needed panel) Move:yes (Ping a needed staff member before you transfer the ticket)",
        "for key related issues, such as a key being invalid, ping the someone that is an admin or higher."
      ]
    },
    "spam": {
      "title": "User spamming staff:",
      "items": [
        "If a user spam-pings staff immediately after opening a ticket or after some time of no response, first warn them to stop and assure them that staff will help soon (or assist them yourself).",
        "If they continue to spam, you may time them out for an hour or less depending on the severity of the mass mentioning"
      ]
    },
    "professionalism": {
      "title": "Professionalism:",
      "items": [
        "Always maintain professional language and conduct when handling tickets.",
        "Do not send unneeded gif''s or photos while handling a ticket."
      ]
    }
  }'::jsonb) on conflict (section_key) do nothing;

-- Function to update timestamp
create or replace function public.update_content_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update timestamp
create trigger content_sections_updated_at
  before update on public.content_sections
  for each row
  execute function public.update_content_timestamp();
