# Editable Staff Cheat Sheet

A Next.js application with Supabase authentication that allows authorized admins to edit website content through a secure admin panel.

## Features

- **Public Cheat Sheet**: View-only website preserving original design
- **Supabase Authentication**: Secure login system for admins
- **Admin Panel**: Edit content sections through an intuitive interface
- **Row Level Security**: Database-level access control
- **Admin Management**: Grant/revoke admin access to users

## Getting Started

### 1. Database Setup

Run the SQL scripts in order:

1. `scripts/001_create_content_sections.sql` - Creates tables and initial content
2. `scripts/002_add_admin_helper_functions.sql` - Adds authorization functions

### 2. Create Your First Admin

After running the scripts, create an account through the login page, then run this SQL in Supabase:

```sql
select public.add_admin('your-email@example.com');
```

Replace `your-email@example.com` with your actual email address.

### 3. Access the Admin Panel

1. Visit `/auth/login` and log in with your credentials
2. Navigate to `/admin` to access the content editor
3. Use `/admin/manage-admins` to grant access to other users

## How It Works

- **Public Site** (`/` or `/cheat-sheet`): Anyone can view the cheat sheet
- **Admin Login** (`/auth/login`): Authentication for admin users
- **Admin Panel** (`/admin`): Protected route for editing content
- **Manage Admins** (`/admin/manage-admins`): Grant admin access to new users

## Editing Content

Content is stored in JSON format in the database. Each section has:
- **Title**: The section heading
- **Content**: JSON object with the section data

To edit:
1. Select a section from the sidebar
2. Modify the title or JSON content
3. Click "Save Changes"

## Security

- Row Level Security (RLS) enabled on all tables
- Only authenticated admins can edit content
- Public read access for the cheat sheet
- Session management via Supabase Auth

## Tech Stack

- Next.js 16 with App Router
- Supabase (Auth + Database)
- TailwindCSS
- TypeScript
