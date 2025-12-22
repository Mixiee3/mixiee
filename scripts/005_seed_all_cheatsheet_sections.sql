-- Seed all cheat sheet sections with actual content
INSERT INTO public.editable_sections (section_key, section_title, section_order, html_content, is_published) VALUES
('ticket_handling', 'Ticket Handling', 1, '<h3>No response from user:</h3>
<ul>
  <li>If a user hasn''t replied within <strong>12+ hours</strong>, ping them.</li>
  <li>If there is still no reply after <strong>4 more hours</strong>, ping one final time.</li>
  <li>If there is still no answer after <strong>4 more hours</strong>, proceed to <strong>close the ticket</strong>.</li>
  <li>If the ticket seems handled, you can issue a <code>/requestclose</code> through chat, and usually members tend to not respond to it, if you do not get a response within 6 hours you can ping them again, and if they don''t respond in another 6-8 hours you can close the ticket.</li>
  <li>Closing the ticket automatically gives a reason saying the ticket was handled, so you don''t need to give a reason.</li>
  <li>If a ticket seems like an issue that isn''t related to technical support, you can use <code>/ticket transfer (the needed panel) Move:yes</code> (Ping a needed staff member before you transfer the ticket)</li>
  <li>for key related issues, such as a key being invalid, ping the someone that is an admin or higher.</li>
</ul>

<h3>User spamming staff:</h3>
<ul>
  <li>If a user spam-pings staff <strong>immediately after opening a ticket or after some time of no response</strong>, first <strong>warn them to stop</strong> and assure them that staff will help soon (or assist them yourself).</li>
  <li>If they continue to spam, <strong>you may time them out for an hour or less</strong> depending on the severity of the mass mentioning</li>
</ul>

<h3>Professionalism:</h3>
<ul>
  <li>Always maintain professional language and conduct when handling tickets.</li>
  <li>Do not send unneeded gif''s or photos while handling a ticket.</li>
</ul>', true),

('legacy_exm_technical', 'Legacy EXM Premium Technical Issues', 2, '<p>Ask for <strong>error codes, system specs, screenshots</strong>, or any relevant information.<br>If unsure about a fix, <strong>@ another staff member</strong> for guidance.</p>

<h3>Xbox Issues</h3>
<p>Check all required Xbox services:</p>
<ul>
  <li>Xbox Live Auth Manager</li>
  <li>Xbox Live Game Save</li>
  <li>Xbox Live Networking Service</li>
  <li>Gaming Services</li>
</ul>

<p>If issues persist:</p>
<ul>
  <li>Revert network tweaks</li>
  <li>Reinstall Microsoft Edge</li>
  <li>Reinstall Required Xbox Services</li>
  <li>Turn off antivirus</li>
</ul>

<h4>Xbox Commands:</h4>
<pre><code>reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XboxGipSvc" /v Start /t REG_DWORD /d 3 /f
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XblAuthManager" /v Start /t REG_DWORD /d 3 /f
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XblGameSave" /v Start /t REG_DWORD /d 3 /f
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\XboxNetApiSvc" /v Start /t REG_DWORD /d 3 /f</code></pre>

<h4>PowerShell Reinstall:</h4>
<pre><code>''Microsoft.XboxApp'',''Microsoft.XboxGamingOverlay'',''Microsoft.XboxGameOverlay'',''Microsoft.XboxLiveGames'',''Microsoft.XboxIdentityProvider'',''Microsoft.XboxSpeechToTextOverlay'',''Microsoft.Xbox.TCUI'',''Microsoft.GamingApp'',''Microsoft.GamingServices'' |
ForEach-Object {
Get-AppxPackage -AllUsers $_ | ForEach-Object {
Add-AppxPackage -Register "$($_.InstallLocation)\\appxmanifest.xml" -DisableDevelopmentMode
}
}</code></pre>

<h3>FPS Drops/Stutters</h3>
<p>This is usually caused by:</p>
<ul>
  <li>Shader cache needing to be rebuilt (AMD/NVIDIA).</li>
  <li>High temperatures.</li>
  <li>Power Throttling.</li>
</ul>
<p>If the user has a X3D Chip:</p>
<ul>
  <li>The utility can cause stability issues to X3D Chips.</li>
  <li>Instruct the user to: Use a system restore point. Avoid CPU tweak options in the utility.</li>
</ul>

<h3>Additional Issues...</h3>
<p>See full documentation for more fixes including Network Issues, Bluetooth, WiFi, Minecraft, Peripherals, Display Problems, Audio, and more.</p>', true),

('fixes_20', '2.0 Fixes + Additional Fixes', 3, '<h3>Valorant Fix</h3>
<p>Run this in cmd or ask Tezzer for a bat file:</p>
<pre><code>reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard" /v "EnableVirtualizationBasedSecurity" /t REG_DWORD /d 1 /f >nul
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard" /v "RequirePlatformSecurityFeatures" /t REG_DWORD /d 1 /f >nul
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" /v "Enabled" /t REG_DWORD /d 1 /f >nul
bcdedit /set hypervisorlaunchtype auto
bcdedit /deletevalue disableelamdrivers
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" /v "MitigationOptions" /t REG_BINARY /d "00000000000000000000000000000000" /f >nul
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" /v "MitigationAuditOptions" /t REG_BINARY /d "00000000000000000000000000000000" /f >nul</code></pre>

<h3>Time Synchronization Failed Fix</h3>
<ul>
  <li>Press Windows Key + R, type <code>timedate.cpl</code>, and press Enter.</li>
  <li>Go to the Internet Time tab, then click Change settings...</li>
  <li>Check the "Synchronize" box, then switch the Server (e.g., from time.windows.com to time.nist.gov).</li>
  <li>Click Update Now.</li>
</ul>

<h3>Clipboard Fix</h3>
<pre><code>reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\cbdhsvc" /v Start /t REG_DWORD /d 2 /f
reg add "HKLM\\SOFTWARE\\Microsoft\\Clipboard" /v EnableClipboardHistory /t REG_DWORD /d 1 /f
reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" /v AllowClipboardHistory /f
reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" /v AllowCrossDeviceClipboard /f</code></pre>

<h3>More fixes available...</h3>
<p>Microsoft Store Fix, Bluetooth Fix, Hz Reset Fix, Download Speed Fix, AMD Adrenaline Fix and more...</p>', true),

('general_troubleshooting', 'General Troubleshooting / Utility Notes', 4, '<ul>
  <li>If the user is on <strong>Windows 11 25H2</strong>, inform them that the utility works best on 23h2/24h2 and windows 10 22h2.</li>
  <li>If none of your fixes work: <strong>@ another staff member</strong> for assistance. Or advise the user to perform a <strong>Clean Install of Windows</strong>.</li>
  <li>For any other issues (whether caused by the utility or not): Search for solutions on <strong>YouTube</strong>, <strong>Google</strong>, or <strong>ChatGPT</strong> to guide the user further.</li>
  <li>If you have any common issues to add to this then message/@Tezzer.</li>
</ul>', true),

('legacy_premium', 'Legacy Premium (Key & Purchasing)', 5, '<div style="background-color: rgba(239,68,68,0.05); border: 1px solid #ef4444; color: #fca5a5; padding: 1.25rem; border-radius: 0.5rem; margin: 1.5rem 0; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
(LOWER STAFF DO NOT HAVE ACCESS TO KEY TICKETS OR PURCHASE TICKETS, SO ANYONE UNDER SR MODERATOR CAN SKIP THIS TILL THE 11TH PAGE NOW)
</div>

<p>This is for Legacy Premium</p>

<h3>Key Issues</h3>
<p><strong>Invalid Key:</strong></p>
<ul>
  <li>Ask if the user has <strong>spoofed</strong> or <strong>changed motherboards</strong>:</li>
  <li>If yes → Direct them to the <strong>New Key channel</strong>.</li>
  <li>If no → Use:</li>
  <li><code>/hwid 1</code> → Windows 10</li>
  <li><code>/hwid 2</code> → Windows 11</li>
  <li>After receiving their HWID and key → Ping a <strong>higher staff member</strong>.</li>
</ul>

<p><strong>Blacklisted:</strong></p>
<ul>
  <li>Ask the user for their key → Ping a <strong>higher staff member</strong>.</li>
</ul>

<p><strong>Missing Key:</strong></p>
<ul>
  <li>Ask for their <strong>email</strong> → Ping a staff member with <strong>database access</strong>.</li>
</ul>

<h3>More key and purchasing procedures...</h3>', true),

('two_zero_tickets', '2.0 Tickets', 6, '<h3>Technical Support Tickets</h3>
<ul>
  <li>Try to solve the tickets to the best of your abilities using the fixes above or doing research and finding your own fixes for users.</li>
  <li>If you see a user opening the wrong ticket, please transfer the ticket to the correct panel to have the correct attention it needs whether that would be an app bug or a tweak related ticket.</li>
</ul>', true),

('moderating_chat', 'Moderating Chat', 7, '<h3>Procedure for Trial Support</h3>
<ul>
  <li>If you need to <strong>ban/kick</strong> a user: Take <strong>screenshots for proof</strong>.</li>
  <li>Copy the <strong>user ID</strong> and send it to <strong>#punishment-proof</strong>.</li>
  <li>If the bot has already logged it, which you can check in user logs; you do not need to log it into punishment proof.</li>
</ul>

<h3>Using Bleed Bot:</h3>
<pre><code>*timeout (user id) (length) (reason)
*kick (user id) (reason)
*ban (user id) (reason)</code></pre>

<h3>Standard Punishments:</h3>
<table style="width:100%; border-collapse: collapse; margin: 1.25rem 0; background-color: #18181b; border-radius: 0.5rem; border: 1px solid #27272a; overflow: hidden;">
  <thead>
    <tr>
      <th style="text-align: left; padding: 1rem; background-color: rgba(59,130,246,0.1); color: #3b82f6; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Offense</th>
      <th style="text-align: left; padding: 1rem; background-color: rgba(59,130,246,0.1); color: #3b82f6; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Punishment</th>
    </tr>
  </thead>
  <tbody style="color: #a1a1aa;">
    <tr style="hover: background-color: rgba(255,255,255,0.02);">
      <td style="padding: 1rem; border-bottom: 1px solid #27272a;">Hard R</td>
      <td style="padding: 1rem; border-bottom: 1px solid #27272a; color: #ef4444;">Permanent Ban</td>
    </tr>
    <tr>
      <td style="padding: 1rem; border-bottom: 1px solid #27272a;">N Word</td>
      <td style="padding: 1rem; border-bottom: 1px solid #27272a;">2 Week Timeout</td>
    </tr>
    <tr>
      <td style="padding: 1rem; border-bottom: 1px solid #27272a;">Chat Spam</td>
      <td style="padding: 1rem; border-bottom: 1px solid #27272a;">4h Timeout (8h if excessive)</td>
    </tr>
  </tbody>
</table>

<p style="margin-top: 1.25rem; text-align: center; color: #3b82f6; font-style: italic;">"This goes for all staff members, NO ARGUING. Avoid talking about unneeded topics in tickets, avoid intervening in other staff members'' tickets unless you have information that would be useful."</p>', true);
