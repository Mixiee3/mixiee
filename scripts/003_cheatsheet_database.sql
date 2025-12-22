-- Drop existing tables if needed
drop table if exists public.cheatsheet_sections cascade;
drop table if exists public.cheatsheet_commands cascade;

-- Create main sections table
create table public.cheatsheet_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  section_title text not null,
  section_order int not null,
  content jsonb not null default '{}'::jsonb,
  is_published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.cheatsheet_sections enable row level security;

-- Anyone can read published sections
create policy "cheatsheet_sections_select_published"
  on public.cheatsheet_sections for select
  using (is_published = true);

-- Only admin users can update
create policy "cheatsheet_sections_update_admin"
  on public.cheatsheet_sections for update
  using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid()
    )
  );

-- Function to update timestamp
create or replace function public.update_cheatsheet_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

-- Trigger for auto-updating timestamps
create trigger cheatsheet_sections_updated_at
  before update on public.cheatsheet_sections
  for each row
  execute function public.update_cheatsheet_timestamp();

-- Insert cheat sheet sections with all content
insert into public.cheatsheet_sections (section_key, section_title, section_order, content) values
('header', 'Header', 1, jsonb_build_object(
  'version', 'v3',
  'subtitle', 'OFFICIAL INTERNAL DOCUMENTATION'
)),

('ticket_handling', 'Ticket Handling', 2, jsonb_build_object(
  'subsections', jsonb_build_array(
    jsonb_build_object(
      'title', 'No response from user:',
      'items', jsonb_build_array(
        'If a user hasn''t replied within <strong>12+ hours</strong>, ping them.',
        'If there is still no reply after <strong>4 more hours</strong>, ping one final time.',
        'If there is still no answer after <strong>4 more hours</strong>, proceed to <strong>close the ticket</strong>.',
        'If the ticket seems handled, you can issue a <code>/requestclose</code> through chat, and usually members tend to not respond to it, if you do not get a response within 6 hours you can ping them again, and if they don''t respond in another 6-8 hours you can close the ticket.',
        'Closing the ticket automatically gives a reason saying the ticket was handled, so you don''t need to give a reason.',
        'If a ticket seems like an issue that isn''t related to technical support, you can use <code>/ticket transfer (the needed panel) Move:yes</code> (Ping a needed staff member before you transfer the ticket)',
        'for key related issues, such as a key being invalid, ping the someone that is an admin or higher.'
      )
    ),
    jsonb_build_object(
      'title', 'User spamming staff:',
      'items', jsonb_build_array(
        'If a user spam-pings staff <strong>immediately after opening a ticket or after some time of no response</strong>, first <strong>warn them to stop</strong> and assure them that staff will help soon (or assist them yourself).',
        'If they continue to spam, <strong>you may time them out for an hour or less</strong> depending on the severity of the mass mentioning'
      )
    ),
    jsonb_build_object(
      'title', 'Professionalism:',
      'items', jsonb_build_array(
        'Always maintain professional language and conduct when handling tickets.',
        'Do not send unneeded gif''s or photos while handling a ticket.'
      )
    )
  )
)),

('legacy_technical', 'Legacy EXM Premium Technical Issues', 3, jsonb_build_object(
  'intro', 'Ask for <strong>error codes, system specs, screenshots</strong>, or any relevant information.<br />If unsure about a fix, <strong>@ another staff member</strong> for guidance.',
  'subsections', jsonb_build_array(
    jsonb_build_object(
      'title', 'Xbox Issues',
      'content', 'Check all required Xbox services:',
      'items', jsonb_build_array(
        'Xbox Live Auth Manager',
        'Xbox Live Game Save',
        'Xbox Live Networking Service',
        'Gaming Services'
      ),
      'additional', 'If issues persist:',
      'additional_items', jsonb_build_array(
        'Revert network tweaks',
        'Reinstall Microsoft Edge',
        'Reinstall Required Xbox Services',
        'Turn off antivirus'
      ),
      'commands', jsonb_build_array(
        jsonb_build_object(
          'label', 'Xbox Commands:',
          'code', E'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XboxGipSvc" /v Start /t REG_DWORD /d 3 /f\nreg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XblAuthManager" /v Start /t REG_DWORD /d 3 /f\nreg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XblGameSave" /v Start /t REG_DWORD /d 3 /f\nreg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XboxNetApiSvc" /v Start /t REG_DWORD /d 3 /f'
        ),
        jsonb_build_object(
          'label', 'PowerShell Reinstall:',
          'code', E'''Microsoft.XboxApp'',''Microsoft.XboxGamingOverlay'',''Microsoft.XboxGameOverlay'',''Microsoft.XboxLiveGames'',''Microsoft.XboxIdentityProvider'',''Microsoft.XboxSpeechToTextOverlay'',''Microsoft.Xbox.TCUI'',''Microsoft.GamingApp'',''Microsoft.GamingServices'' |\nForEach-Object {\nGet-AppxPackage -AllUsers $_ | ForEach-Object {\nAdd-AppxPackage -Register "$($_.InstallLocation)\\appxmanifest.xml" -DisableDevelopmentMode }}'
        )
      )
    )
  )
)) on conflict (section_key) do nothing;
